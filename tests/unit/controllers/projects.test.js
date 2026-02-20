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

jest.mock('../../../src/server/models/Project');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const Project = require('../../../src/server/models/Project');

const SAMPLE_PROJECT = {
  id: 'proj-uuid-1',
  name: 'CRM Rollout',
  status: 'active',
  company_id: 'company-uuid-1',
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/projects', () => {
  test('returns paginated project list', async () => {
    Project.list.mockResolvedValue({ data: [SAMPLE_PROJECT], total: 1 });
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('CRM Rollout');
  });
});

describe('GET /api/v1/projects/:id', () => {
  test('returns project with members and contacts when found', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/projects/proj-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('CRM Rollout');
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/projects', () => {
  test('creates project and returns 201', async () => {
    Project.create.mockResolvedValue(SAMPLE_PROJECT);
    const res = await request(app)
      .post('/api/v1/projects')
      .send({ name: 'CRM Rollout' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('CRM Rollout');
  });

  test('returns 422 when name is missing', async () => {
    const res = await request(app).post('/api/v1/projects').send({});
    expect(res.status).toBe(422);
  });

  test('returns 422 for invalid status', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .send({ name: 'Test', status: 'invalid_status' });
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/projects/:id', () => {
  test('updates project and returns 200', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.update.mockResolvedValue({ ...SAMPLE_PROJECT, name: 'Updated' });
    const res = await request(app)
      .put('/api/v1/projects/proj-uuid-1')
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  test('returns 404 for non-existent project', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/projects/bad-id').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/projects/:id', () => {
  test('soft-deletes project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.softDelete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/projects/proj-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 404 when deleting non-existent project', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/projects/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/projects/:id/contacts', () => {
  test('adds contact to project', async () => {
    Project.addContact.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/contacts')
      .send({ contact_id: 'contact-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when contact_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/contacts')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/projects/:id/members', () => {
  test('adds member to project', async () => {
    Project.addMember.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/members')
      .send({ user_id: 'user-1', role: 'developer' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when user_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/members')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/projects/:id/notes', () => {
  test('returns notes for project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.getNotes.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/projects/proj-uuid-1/notes');
    expect(res.status).toBe(200);
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/bad-id/notes');
    expect(res.status).toBe(404);
  });
});
