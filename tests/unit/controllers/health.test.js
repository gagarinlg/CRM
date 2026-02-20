'use strict';

// The /health endpoint doesn't use the database at all
const request = require('supertest');
const app = require('../../../src/server/app');

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('includes timestamp in response', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeTruthy();
    // Verify it is a valid ISO date string
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  test('includes uptime in response', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
