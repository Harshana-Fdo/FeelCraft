import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config/env.js';
import { checkDatabase, createDatabase } from '../src/config/database.js';

test('stores immutable publication snapshots and enforces recipient access and ownership', {
  skip: process.env.FEELCRAFT_TEST_MYSQL !== '1',
}, async () => {
  const config = readConfig();
  const db = createDatabase();
  const emails = Array.from({ length: 2 }, () => randomUUID() + '@feelcraft.test');
  let fixturePublication;
  try {
    await checkDatabase(db);
    const app = request(createApp(config, db));
    async function register(email) {
      const { body } = await app.post('/api/auth/register')
        .send({ name: 'Private account name', email, password: randomUUID() }).expect(201);
      return req => req.auth(body.data.accessToken, { type: 'bearer' });
    }
    const owner = await register(emails[0]);
    const other = await register(emails[1]);
    const { body: { data: template } } = await app.get('/api/templates/eternal-love').expect(200);
    const { body: { data: draft } } = await owner(app.post('/api/designs')).send({
      title: 'A saved draft', templateSlug: template.slug, document: template.document,
    }).expect(201);
    const options = {
      designId: draft.id, title: 'For your birthday', identity: 'anonymous', recipient: 'A friend',
      sender: 'Do not expose this', signature: 'Do not expose this either', category: 'love',
      openingAnimation: 'envelope', backgroundEffect: 'hearts', music: 'ambient',
      password: 'letter code', expiresAt: null,
    };
    await other(app.post('/api/publications')).send(options).expect(404);
    const { body: { data: publication } } = await owner(app.post('/api/publications')).send(options).expect(201);
    fixturePublication = publication.id;
    assert.match(publication.token, /^[\w-]{43}$/);
    assert.ok(publication.url.endsWith('/m/' + publication.token));
    const managed = '/api/publications/' + publication.id;
    const shared = '/api/messages/' + publication.token;
    await other(app.get(managed + '/preview')).expect(404);
    await other(app.patch(managed + '/privacy')).send({ expiresAt: null, password: '' }).expect(404);
    await other(app.post(managed + '/revoke')).expect(404);
    await other(app.delete(managed)).expect(404);
    const locked = await app.get(shared).expect(401);
    assert.equal(locked.body.code, 'locked');
    assert.equal(locked.body.data, undefined);
    await app.post(shared + '/unlock').send({ password: 'wrong' }).expect(401);
    const { body: { data: opened } } = await app.post(shared + '/unlock').send({ password: options.password }).expect(200);
    assert.deepEqual(Object.keys(opened.message).sort(), ['category', 'document', 'music', 'recipient', 'signature', 'title']);
    assert.equal(opened.message.signature, '');
    assert.ok(opened.message.document.elements.every(layer => layer.id !== 'signature'));
    assert.ok(!JSON.stringify(opened).includes('Private account name'));
    const original = structuredClone(opened.message.document);
    const edited = structuredClone(draft.document);
    edited.elements.find(layer => layer.type === 'text').content = 'Edit after publishing';
    await owner(app.put('/api/designs/' + draft.id)).send({ title: draft.title, document: edited, revision: draft.revision }).expect(200);
    const withAccess = req => req.auth(opened.access, { type: 'bearer' });
    const after = await withAccess(app.get(shared)).expect(200);
    assert.deepEqual(after.body.data.message.document, original);
    await app.post(shared + '/views').expect(401);
    await withAccess(app.post(shared + '/views')).expect(200);
    const { body: { data: entries } } = await owner(app.get('/api/publications')).expect(200);
    assert.equal(entries[0].views, 1);
    await withAccess(app.post(shared + '/reports')).send({ reason: 'other', details: 'Temporary integration test' }).expect(201);
    await owner(app.patch(managed + '/privacy')).send({ expiresAt: null, password: 'new letter code' }).expect(200);
    await withAccess(app.get(shared)).expect(401);
    await db.execute('UPDATE publications SET expires_at = UTC_TIMESTAMP(3) - INTERVAL 1 SECOND WHERE id = ?', [publication.id]);
    const expired = await app.post(shared + '/unlock').send({ password: 'new letter code' }).expect(410);
    assert.equal(expired.body.code, 'expired');
    const { body: { data: version } } = await owner(app.post('/api/publications'))
      .send({ ...options, identity: 'signature', signature: 'Your friend', password: '' }).expect(201);
    assert.notEqual(version.token, publication.token);
    const { body: { data: { message: updated } } } = await app.get('/api/messages/' + version.token).expect(200);
    assert.ok(updated.document.elements.some(layer => layer.content === 'Edit after publishing'));
    assert.ok(updated.document.elements.some(layer => layer.content === 'Your friend'));
    await owner(app.post(managed + '/revoke')).expect(200);
    const revoked = await app.get(shared).expect(410);
    assert.equal(revoked.body.code, 'revoked');
    await owner(app.post('/api/publications/' + version.id + '/unpublish')).expect(200);
    const unpublished = await app.get('/api/messages/' + version.token).expect(404);
    assert.equal(unpublished.body.code, 'unpublished');
    await owner(app.delete('/api/publications/' + version.id)).expect(200);
  } finally {
    try {
      if (fixturePublication) await db.execute('DELETE FROM publication_reports WHERE publication_id = ? AND details = ?',
        [fixturePublication, 'Temporary integration test']);
      await db.execute('DELETE FROM users WHERE email IN (?, ?)', emails);
    }
    finally { await db.end(); }
  }
});
