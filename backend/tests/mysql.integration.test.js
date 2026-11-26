import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config/env.js';
import { checkDatabase, createDatabase } from '../src/config/database.js';

test('persists a starter template edit in the configured MariaDB or MySQL database', { skip: process.env.FEELCRAFT_TEST_MYSQL !== '1' }, async () => {
  const config = readConfig();
  const db = createDatabase();
  assert.ok(db && config.jwtSecret, 'Configure the database and JWT_ACCESS_SECRET before running this test.');
  const email = randomUUID() + '@feelcraft.test';
  let accountCreated = false;
  try {
    const server = await checkDatabase(db);
    assert.equal(server.databaseName, process.env.DB_NAME || 'feelcraft_db');
    const agent = request(createApp(config, db));
    const { body: { data: categories } } = await agent.get('/api/categories').expect(200);
    assert.ok(categories.length >= 5);
    const { body: { data: templates } } = await agent.get('/api/templates').expect(200);
    assert.equal(templates.length >= 5, true);
    const password = randomUUID();
    await agent.post('/api/auth/register').send({ name: 'Integration test', email, password }).expect(201);
    accountCreated = true;
    const login = await agent.post('/api/auth/login').send({ email, password }).expect(200);
    const priorCookie = login.headers['set-cookie'][0].split(';')[0];
    const renewed = await agent.post('/api/auth/refresh').set('Cookie', priorCookie).expect(200);
    await agent.post('/api/auth/refresh').set('Cookie', priorCookie).expect(401);
    const auth = req => req.auth(renewed.body.data.accessToken, { type: 'bearer' });
    const template = templates[0];
    const { body: { data: draft } } = await auth(agent.post('/api/designs')).send({
      title: template.name, templateSlug: template.slug, document: template.document,
    }).expect(201);
    const path = '/api/designs/' + draft.id;
    draft.document.elements.find(layer => layer.type === 'text').content = 'ආදරයෙන්';
    await auth(agent.put(path)).send(draft).expect(200);
    const freshApp = request(createApp(config, db));
    const { body: { data: reopened } } = await auth(freshApp.get(path)).expect(200);
    assert.deepEqual(reopened.document, draft.document);
    assert.equal(reopened.revision, 2);
    const { body: { data: drafts } } = await auth(freshApp.get('/api/designs')).expect(200);
    assert.ok(drafts.some(item => item.id === draft.id && item.revision === 2));
    await auth(agent.post(path + '/duplicate')).expect(201);
    await auth(agent.delete(path)).expect(200);
    await auth(freshApp.get(path)).expect(404);
    await agent.post('/api/auth/logout').set('Cookie', renewed.headers['set-cookie'][0].split(';')[0]).expect(200);
  } finally {
    try {
      if (accountCreated) await db.execute('DELETE FROM users WHERE email = ?', [email]);
    } finally {
      await db.end();
    }
  }
});
