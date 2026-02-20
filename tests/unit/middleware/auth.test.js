'use strict';

// Set JWT secret before any module loads
process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';

// Mock the database module – the factory must be self-contained (no out-of-scope vars)
jest.mock('../../../src/server/config/database', () => {
  // Build a chainable query-builder that can be configured per-test via module-level state
  const state = { firstResult: null, pluckResults: [], pluckIndex: 0 };

  const chain = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    first: jest.fn(() => Promise.resolve(state.firstResult)),
    pluck: jest.fn(() => {
      const val = state.pluckResults[state.pluckIndex] ?? [];
      state.pluckIndex += 1;
      return Promise.resolve(val);
    }),
  };

  const db = jest.fn(() => chain);
  db.fn = { now: jest.fn().mockReturnValue('NOW()') };
  // Expose state so tests can configure it
  db.__state = state;
  db.__chain = chain;

  return {
    db,
    connectDB: jest.fn().mockResolvedValue(undefined),
    disconnectDB: jest.fn().mockResolvedValue(undefined),
  };
});

const jwt = require('jsonwebtoken');
const { verifyToken, requireRole, requirePermission } = require('../../../src/server/middleware/auth');
const { db } = require('../../../src/server/config/database');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeToken(payload = {}) {
  return jwt.sign(
    { sub: 'user-id-123', email: 'test@example.com', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'crm-api' },
  );
}

describe('verifyToken middleware', () => {
  beforeEach(() => {
    // Reset state before each test
    db.__state.firstResult = null;
    db.__state.pluckResults = [];
    db.__state.pluckIndex = 0;
    // Reset call counts on chain methods
    Object.values(db.__chain).forEach((fn) => { if (fn.mockClear) fn.mockClear(); });
  });

  test('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = mockRes();
    await verifyToken(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when token does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = mockRes();
    await verifyToken(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for a completely invalid token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    await verifyToken(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when user is not found in DB', async () => {
    db.__state.firstResult = null;

    const req = { headers: { authorization: `Bearer ${makeToken()}` } };
    const res = mockRes();
    await verifyToken(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when account is deactivated', async () => {
    db.__state.firstResult = { id: 'user-id-123', is_active: false };

    const req = { headers: { authorization: `Bearer ${makeToken()}` } };
    const res = mockRes();
    await verifyToken(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calls next() and attaches user for a valid token and active user', async () => {
    db.__state.firstResult = { id: 'user-id-123', email: 'test@example.com', is_active: true };
    db.__state.pluckResults = [['admin'], ['companies.read']];
    db.__state.pluckIndex = 0;

    const req = { headers: { authorization: `Bearer ${makeToken()}` } };
    const res = mockRes();
    const next = jest.fn();
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe('user-id-123');
    expect(req.user.roles).toContain('admin');
  });
});

describe('requireRole middleware', () => {
  test('calls next() when user has the required role', () => {
    const req = { user: { roles: ['admin', 'manager'] } };
    const res = mockRes();
    const next = jest.fn();
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when user lacks the required role', () => {
    const req = { user: { roles: ['user'] } };
    const res = mockRes();
    requireRole('admin')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 401 when no user attached to request', () => {
    const req = {};
    const res = mockRes();
    requireRole('admin')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requirePermission middleware', () => {
  test('calls next() when user has all required permissions', () => {
    const req = { user: { permissions: ['companies.read', 'companies.write'] } };
    const res = mockRes();
    const next = jest.fn();
    requirePermission('companies.read', 'companies.write')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when user is missing a permission', () => {
    const req = { user: { permissions: ['companies.read'] } };
    const res = mockRes();
    requirePermission('companies.read', 'companies.delete')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
