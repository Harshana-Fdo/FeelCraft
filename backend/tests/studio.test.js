import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

const testConfig = { clientOrigin: 'http://localhost:5173', jwtSecret: 'test-only signing key with more than 32 bytes', secureCookies: true };
const draft = {
  title: 'New letter', templateSlug: null,
  document: {
    schemaVersion: 1,
    canvas: { width: 1080, height: 1350, background: { type: 'color', value: '#fffdf8' } },
    elements: [],
    experience: { openingAnimation: 'envelope', backgroundEffect: 'none', music: null },
  },
};

test('authenticates and rotates sessions and keeps draft operations owner-scoped', async () => {
  const users = new Map();
  const sessions = new Map();
  const drafts = new Map();
  const key = (owner, id) => owner + ':' + id;
  const app = createApp(testConfig, null, {
    catalog: { categories: async () => [{ slug: 'love' }], templates: async () => [] },
    users: {
      create: async (user, password_hash) => { users.set(user.email, { ...user, password_hash }); },
      find: async email => users.get(email),
      issue: async (hash, user) => { sessions.set(hash.toString('hex'), user); },
      rotate: async (hash, next) => {
        const id = sessions.get(hash.toString('hex'));
        if (!id) return;
        sessions.delete(hash.toString('hex'));
        sessions.set(next.toString('hex'), id);
        return [...users.values()].find(user => user.id === id);
      },
      revoke: async hash => { sessions.delete(hash.toString('hex')); },
    },
    designs: {
      get: async (owner, id) => drafts.get(key(owner, id)),
      list: async owner => [...drafts.values()].filter(row => row.owner === owner),
      create: async (owner, draft) => {
        const record = { ...draft, owner, revision: 1 };
        drafts.set(key(owner, draft.id), record);
        return record;
      },
      update: async (owner, id, input) => {
        const record = drafts.get(key(owner, id));
        if (!record) return null;
        if (record.revision !== input.revision) return { conflict: true };
        Object.assign(record, input, { revision: input.revision + 1 });
        return { revision: record.revision };
      },
      remove: async (owner, id) => drafts.delete(key(owner, id)),
    },
  });
  const agent = request(app);
  await agent.get('/api/categories/love').expect(200);
  await agent.get('/api/designs').expect(401);
  const register = email => agent.post('/api/auth/register').send({ name: 'Test writer', email, password: 'strong test password' }).expect(201);
  const owner = await register('writer@example.test');
  const other = await register('other@example.test');
  const { accessToken, user } = owner.body.data;
  assert.equal(user.password_hash, undefined);
  assert.notEqual(users.get(user.email).password_hash, 'strong test password');
  const cookie = owner.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const previous = cookie.split(';')[0];
  await agent.post('/api/auth/refresh').set('Origin', 'https://example.test').set('Cookie', previous).expect(403);
  const refreshed = await agent.post('/api/auth/refresh').set('Cookie', previous).expect(200);
  await agent.post('/api/auth/refresh').set('Cookie', previous).expect(401);
  await agent.post('/api/auth/logout').set('Cookie', refreshed.headers['set-cookie'][0].split(';')[0]).expect(200);
  await agent.post('/api/auth/refresh').set('Cookie', refreshed.headers['set-cookie'][0].split(';')[0]).expect(401);
  await agent.post('/api/auth/login').send({ email: user.email, password: 'wrong password' }).expect(401);
  await agent.post('/api/auth/login').send({ email: user.email, password: 'strong test password' }).expect(200);

  const created = await agent.post('/api/designs').auth(accessToken, { type: 'bearer' }).send(draft).expect(201);
  const path = '/api/designs/' + created.body.data.id;
  await agent.get(path).auth(other.body.data.accessToken, { type: 'bearer' }).expect(404);
  await agent.put(path).auth(accessToken, { type: 'bearer' }).send({ ...draft, revision: 1, title: 'ආදරය' }).expect(200);
  await agent.put(path).auth(accessToken, { type: 'bearer' }).send({ ...draft, revision: 1 }).expect(409);
  const reopened = await agent.get(path).auth(accessToken, { type: 'bearer' }).expect(200);
  assert.equal(reopened.body.data.title, 'ආදරය');
  await agent.post(path + '/duplicate').auth(accessToken, { type: 'bearer' }).expect(201);
  await agent.delete(path).auth(accessToken, { type: 'bearer' }).expect(200);
  await agent.get(path).auth(accessToken, { type: 'bearer' }).expect(404);
  await agent.post('/api/designs').auth(accessToken, { type: 'bearer' })
    .send({ ...draft, document: { ...draft.document, canvas: { ...draft.document.canvas, background: { type: 'image', value: 'data:image/svg+xml;base64,AAAA' } } } }).expect(400);
});
