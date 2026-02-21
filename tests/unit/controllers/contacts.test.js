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

jest.mock('../../../src/server/models/Contact');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const Contact = require('../../../src/server/models/Contact');

const SAMPLE_CONTACT = {
  id: 'contact-uuid-5678',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  position: 'CTO',
  company_id: 'company-uuid-1234',
  phones: [{ phone_number: '+1-555-0200', label: 'work', is_primary: true }],
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/contacts', () => {
  test('returns paginated contact list', async () => {
    Contact.list.mockResolvedValue({ data: [SAMPLE_CONTACT], total: 1 });

    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(200);
    expect(res.body.data[0].first_name).toBe('Jane');
  });
});

describe('GET /api/v1/contacts/:id', () => {
  test('returns contact when found', async () => {
    Contact.findById.mockResolvedValue(SAMPLE_CONTACT);

    const res = await request(app).get('/api/v1/contacts/contact-uuid-5678');
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('jane.smith@example.com');
  });

  test('returns 404 for unknown contact', async () => {
    Contact.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/contacts/unknown');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/contacts', () => {
  test('creates contact and returns 201', async () => {
    Contact.create.mockResolvedValue(SAMPLE_CONTACT);

    const res = await request(app)
      .post('/api/v1/contacts')
      .send({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.first_name).toBe('Jane');
  });

  test('returns 422 when first_name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ last_name: 'Smith', email: 'test@example.com' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when email is missing (required field)', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ first_name: 'Jane', last_name: 'Smith' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .send({ first_name: 'Jane', last_name: 'Smith', email: 'not-an-email' });

    expect(res.status).toBe(422);
  });
});

describe('DELETE /api/v1/contacts/:id', () => {
  test('soft-deletes contact and returns 200', async () => {
    Contact.findById.mockResolvedValue(SAMPLE_CONTACT);
    Contact.softDelete.mockResolvedValue(1);

    const res = await request(app).delete('/api/v1/contacts/contact-uuid-5678');
    expect(res.status).toBe(200);
  });
});
