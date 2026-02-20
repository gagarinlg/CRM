'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-32chars!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

jest.mock('../../../src/server/config/database', () => ({
  db: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock the entire authService so the controller tests don't hit the DB
jest.mock('../../../src/server/services/authService');

const request = require('supertest');
const app = require('../../../src/server/app');
const authService = require('../../../src/server/services/authService');

const SAMPLE_USER = {
  id: 'user-uuid-1234',
  email: 'user@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  force_password_change: false,
};

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/auth/login', () => {
  test('returns 200 with tokens on successful login', async () => {
    authService.login.mockResolvedValue({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: SAMPLE_USER,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'user@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('mock-access-token');
    expect(res.body.data.user.email).toBe('user@example.com');
  });

  test('returns 200 with requires_totp flag when 2FA is enabled', async () => {
    authService.login.mockResolvedValue({
      requires_totp: true,
      pre_auth_token: 'mock-pre-auth-token',
      user: { id: SAMPLE_USER.id, email: SAMPLE_USER.email },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'user@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.data.requires_totp).toBe(true);
  });

  test('returns 422 when identifier is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password1' });

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
  });

  test('returns 422 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'user@example.com' });

    expect(res.status).toBe(422);
  });

  test('propagates service errors (e.g. 401 for bad credentials)', async () => {
    authService.login.mockRejectedValue(
      Object.assign(new Error('Invalid credentials.'), { statusCode: 401 }),
    );

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'wrong@example.com', password: 'BadPass1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  test('returns 400 when refresh_token is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  test('returns new access_token on valid refresh', async () => {
    authService.refreshToken.mockResolvedValue({ access_token: 'new-access-token' });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('new-access-token');
  });
});

describe('POST /api/v1/auth/2fa/verify', () => {
  test('returns 422 when pre_auth_token is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ totp_token: '123456' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when totp_token is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ pre_auth_token: 'some-token' });

    expect(res.status).toBe(422);
  });

  test('returns tokens on successful TOTP verification', async () => {
    authService.verifyTotpLogin.mockResolvedValue({
      access_token: 'full-access-token',
      refresh_token: 'full-refresh-token',
      user: SAMPLE_USER,
    });

    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ pre_auth_token: 'pre-auth-token', totp_token: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('full-access-token');
  });
});
