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
    req.user = { id: 'test-user-id', email: 'admin@example.com', roles: ['admin'], permissions: [] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

jest.mock('../../../src/server/models/Lead');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const Lead = require('../../../src/server/models/Lead');

const SAMPLE_LEAD = {
  id: 'lead-uuid-1',
  title: 'Big Deal',
  value: 50000,
  status: 'open',
  stage: 'qualified',
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/leads', () => {
  test('returns paginated lead list', async () => {
    Lead.list.mockResolvedValue({ data: [SAMPLE_LEAD], total: 1 });
    const res = await request(app).get('/api/v1/leads');
    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe('Big Deal');
  });
});

describe('GET /api/v1/leads/stats/pipeline', () => {
  test('returns pipeline stats', async () => {
    Lead.getPipelineStats.mockResolvedValue({ total_value: 100000, count: 2 });
    const res = await request(app).get('/api/v1/leads/stats/pipeline');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/leads/stats/conversion', () => {
  test('returns conversion stats', async () => {
    Lead.getConversionStats.mockResolvedValue({ won: 1, lost: 1 });
    const res = await request(app).get('/api/v1/leads/stats/conversion');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/leads/:id', () => {
  test('returns lead when found', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    const res = await request(app).get('/api/v1/leads/lead-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Big Deal');
  });

  test('returns 404 when lead not found', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/leads/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/leads', () => {
  test('creates lead and returns 201', async () => {
    Lead.create.mockResolvedValue(SAMPLE_LEAD);
    const res = await request(app)
      .post('/api/v1/leads')
      .send({ title: 'Big Deal' });
    expect(res.status).toBe(201);
  });

  test('returns 422 when title is missing', async () => {
    const res = await request(app).post('/api/v1/leads').send({});
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/leads/:id', () => {
  test('updates lead and returns 200', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    Lead.update.mockResolvedValue({ ...SAMPLE_LEAD, title: 'Bigger Deal' });
    const res = await request(app)
      .put('/api/v1/leads/lead-uuid-1')
      .send({ title: 'Bigger Deal' });
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent lead', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/leads/bad-id').send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/leads/:id', () => {
  test('soft-deletes lead', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    Lead.softDelete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/leads/lead-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent lead', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/leads/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/leads/:id/stage', () => {
  test('moves lead to new stage', async () => {
    Lead.moveStage.mockResolvedValue({ ...SAMPLE_LEAD, stage: 'proposal' });
    const res = await request(app)
      .patch('/api/v1/leads/lead-uuid-1/stage')
      .send({ stage: 'proposal' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when stage is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/leads/lead-uuid-1/stage')
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 when lead not found during stage move', async () => {
    Lead.moveStage.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/leads/bad-id/stage')
      .send({ stage: 'won' });
    expect(res.status).toBe(404);
  });
});
