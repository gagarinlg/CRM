'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-32chars!';

jest.mock('../../../src/server/config/database', () => ({
  db: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/server/middleware/auth', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'admin-user-id', email: 'admin@example.com', roles: ['admin'], permissions: [] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

// Mock the demoDataService so HTTP tests don't need a real DB
jest.mock('../../../src/server/services/demoDataService');

const request = require('supertest');
const app = require('../../../src/server/app');
const demoDataService = require('../../../src/server/services/demoDataService');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/settings/demo-data', () => {
  test('returns 200 and loaded counts when data is freshly loaded', async () => {
    demoDataService.load.mockResolvedValue({
      loaded: true,
      counts: { companies: 3, contacts: 4, groups: 2, tags: 4, projects: 3, leads: 4, notes: 5, events: 3 },
    });

    const res = await request(app).post('/api/v1/settings/demo-data');

    expect(res.status).toBe(200);
    expect(res.body.data.loaded).toBe(true);
    expect(res.body.data.counts.companies).toBe(3);
    expect(res.body.data.counts.contacts).toBe(4);
    expect(res.body.data.counts.events).toBe(3);
    expect(demoDataService.load).toHaveBeenCalledWith('admin-user-id');
  });

  test('returns 200 with alreadyLoaded flag when demo data exists', async () => {
    demoDataService.load.mockResolvedValue({ alreadyLoaded: true });

    const res = await request(app).post('/api/v1/settings/demo-data');

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyLoaded).toBe(true);
  });

  test('propagates service errors to error handler', async () => {
    demoDataService.load.mockRejectedValue(new Error('DB failure'));

    const res = await request(app).post('/api/v1/settings/demo-data');

    expect(res.status).toBe(500);
  });
});
