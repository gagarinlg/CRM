'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-32chars!';

// ── Database mock ─────────────────────────────────────────────────────────────
jest.mock('../../../src/server/config/database', () => ({
  db: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

// ── Auth middleware mock (bypass JWT/DB lookup) ───────────────────────────────
jest.mock('../../../src/server/middleware/auth', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'test-user-id', email: 'admin@example.com', roles: ['admin'], permissions: ['companies.read', 'companies.write', 'companies.delete'] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

// ── Company model mock ────────────────────────────────────────────────────────
jest.mock('../../../src/server/models/Company');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const Company = require('../../../src/server/models/Company');

const SAMPLE_COMPANY = {
  id: 'company-uuid-1234',
  name: 'Acme Corp',
  email: 'info@acme.com',
  phone: '+1-555-0100',
  website: 'https://acme.com',
  industry: 'Technology',
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/v1/companies', () => {
  test('returns paginated company list', async () => {
    Company.list.mockResolvedValue({ data: [SAMPLE_COMPANY], total: 1 });

    const res = await request(app).get('/api/v1/companies');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('Acme Corp');
  });

  test('returns empty list when no companies exist', async () => {
    Company.list.mockResolvedValue({ data: [], total: 0 });

    const res = await request(app).get('/api/v1/companies');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/v1/companies/:id', () => {
  test('returns 200 with company when found', async () => {
    Company.findById.mockResolvedValue(SAMPLE_COMPANY);

    const res = await request(app).get('/api/v1/companies/company-uuid-1234');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Acme Corp');
  });

  test('returns 404 when company does not exist', async () => {
    Company.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/companies/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

describe('POST /api/v1/companies', () => {
  test('creates a company and returns 201', async () => {
    Company.create.mockResolvedValue(SAMPLE_COMPANY);

    const res = await request(app)
      .post('/api/v1/companies')
      .send({ name: 'Acme Corp', email: 'info@acme.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Acme Corp');
  });

  test('returns 422 when company name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/companies')
      .send({ email: 'info@acme.com' });

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
  });

  test('returns 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/companies')
      .send({ name: 'Test', email: 'not-an-email' });

    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/companies/:id', () => {
  test('updates a company and returns the updated data', async () => {
    Company.findById.mockResolvedValue(SAMPLE_COMPANY);
    Company.update.mockResolvedValue({ ...SAMPLE_COMPANY, name: 'Updated Corp' });

    const res = await request(app)
      .put('/api/v1/companies/company-uuid-1234')
      .send({ name: 'Updated Corp' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Corp');
  });

  test('returns 404 when updating a non-existent company', async () => {
    Company.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/companies/nonexistent')
      .send({ name: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/companies/:id', () => {
  test('soft-deletes a company and returns 200', async () => {
    Company.findById.mockResolvedValue(SAMPLE_COMPANY);
    Company.softDelete.mockResolvedValue(1);

    const res = await request(app).delete('/api/v1/companies/company-uuid-1234');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('returns 404 when deleting a non-existent company', async () => {
    Company.findById.mockResolvedValue(null);

    const res = await request(app).delete('/api/v1/companies/nonexistent');
    expect(res.status).toBe(404);
  });
});
