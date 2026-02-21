'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-32chars!';

jest.mock('../../../src/server/config/database', () => {
  const db = jest.fn();
  db.fn = { now: jest.fn().mockReturnValue('NOW()') };
  return {
    db,
    connectDB: jest.fn().mockResolvedValue(undefined),
    disconnectDB: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('../../../src/server/middleware/auth', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user-id', email: 'admin@example.com', roles: ['admin'], permissions: [] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

const { db } = require('../../../src/server/config/database');

function makeChain(data = []) {
  const chain = {
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    orWhereIn: jest.fn().mockReturnThis(),
    orWhereILike: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    pluck: jest.fn().mockResolvedValue([]),
    first: jest.fn().mockResolvedValue(null),
    limit: jest.fn().mockResolvedValue(data),
  };
  chain.where.mockReturnValue(chain);
  chain.whereIn.mockReturnValue(chain);
  chain.whereNull.mockReturnValue(chain);
  return chain;
}

db.mockImplementation(() => makeChain());

const request = require('supertest');
const app = require('../../../src/server/app');

beforeEach(() => {
  jest.clearAllMocks();
  db.mockImplementation(() => makeChain());
});

describe('GET /api/v1/search', () => {
  test('returns empty results when query is too short', async () => {
    const res = await request(app).get('/api/v1/search?q=a');
    expect(res.status).toBe(200);
    expect(res.body.data.projects).toEqual([]);
    expect(res.body.data.leads).toEqual([]);
  });

  test('returns empty results when query is missing', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(200);
    expect(res.body.data.projects).toEqual([]);
  });

  test('searches with a valid query and returns structure', async () => {
    const chain = makeChain([{ id: 'proj-1', name: 'Test Project', status: 'active' }]);
    db.mockImplementation(() => chain);

    const res = await request(app).get('/api/v1/search?q=test');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('projects');
    expect(res.body.data).toHaveProperty('leads');
    expect(res.body.data).toHaveProperty('contacts');
    expect(res.body.data).toHaveProperty('companies');
  });
});
