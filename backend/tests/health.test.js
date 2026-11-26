import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config/env.js';

const clientOrigin = 'http://localhost:5173';
const app = createApp({ clientOrigin });

test('reports API liveness without requiring MySQL', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('allows the configured browser origin only', async () => {
  await request(app).get('/api/health').set('Origin', clientOrigin)
    .expect('Access-Control-Allow-Origin', clientOrigin);
  const response = await request(app).get('/api/health').set('Origin', 'https://example.com');
  assert.equal(response.headers['access-control-allow-origin'], undefined);
});

test('uses secure cookies for an HTTPS sharing origin and trusts only configured origins', async () => {
  const publicAppUrl = 'https://feelcraft-preview.trycloudflare.com';
  const config = readConfig({ CLIENT_URL: clientOrigin, PUBLIC_APP_URL: publicAppUrl });
  assert.equal(config.secureCookies, true);
  const tunnelApp = request(createApp(config));
  await tunnelApp.get('/api/health').set('Origin', clientOrigin).expect('Access-Control-Allow-Origin', clientOrigin);
  await tunnelApp.get('/api/health').set('Origin', publicAppUrl).expect('Access-Control-Allow-Origin', publicAppUrl);
  const other = await tunnelApp.get('/api/health').set('Origin', 'https://another-preview.trycloudflare.com');
  assert.equal(other.headers['access-control-allow-origin'], undefined);
});

test('uses a consistent envelope for missing routes and malformed JSON', async () => {
  await request(app).get('/api/missing').expect(404, {
    success: false, message: 'Route not found', errors: [],
  });
  await request(app).post('/api/health').set('Content-Type', 'application/json').send('{')
    .expect(400, { success: false, message: 'Invalid JSON', errors: [] });
});
