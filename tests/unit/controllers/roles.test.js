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

jest.mock('../../../src/server/models/Role');

const request = require('supertest');
const app = require('../../../src/server/app');
const Role = require('../../../src/server/models/Role');

const SAMPLE_ROLE = {
  id: 'role-uuid-1',
  name: 'manager',
  description: 'Manager role',
  is_system: false,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/roles', () => {
  test('returns list of roles', async () => {
    Role.list.mockResolvedValue([SAMPLE_ROLE]);
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('manager');
  });
});

describe('GET /api/v1/roles/permissions', () => {
  test('returns list of all permissions', async () => {
    Role.listPermissions.mockResolvedValue([{ id: 'p1', name: 'contacts.read' }]);
    const res = await request(app).get('/api/v1/roles/permissions');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/roles/:id', () => {
  test('returns role with permissions', async () => {
    Role.findById.mockResolvedValue(SAMPLE_ROLE);
    Role.getPermissions.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/roles/role-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('manager');
  });

  test('returns 404 when role not found', async () => {
    Role.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/roles/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/roles', () => {
  test('creates role and returns 201', async () => {
    Role.create.mockResolvedValue(SAMPLE_ROLE);
    const res = await request(app)
      .post('/api/v1/roles')
      .send({ name: 'manager', description: 'Manager role' });
    expect(res.status).toBe(201);
  });

  test('returns 422 when name is missing', async () => {
    const res = await request(app).post('/api/v1/roles').send({});
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/roles/:id', () => {
  test('updates role', async () => {
    Role.findById.mockResolvedValue(SAMPLE_ROLE);
    Role.update.mockResolvedValue({ ...SAMPLE_ROLE, description: 'Updated' });
    const res = await request(app)
      .put('/api/v1/roles/role-uuid-1')
      .send({ description: 'Updated' });
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent role', async () => {
    Role.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/roles/bad-id').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/roles/:id', () => {
  test('deletes non-system role', async () => {
    Role.findById.mockResolvedValue(SAMPLE_ROLE);
    Role.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/roles/role-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 400 when trying to delete a system role', async () => {
    Role.findById.mockResolvedValue({ ...SAMPLE_ROLE, is_system: true });
    const res = await request(app).delete('/api/v1/roles/role-uuid-1');
    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent role', async () => {
    Role.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/roles/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/roles/:id/permissions', () => {
  test('assigns permission to role', async () => {
    Role.assignPermission.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/roles/role-uuid-1/permissions')
      .send({ permission_id: 'perm-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when permission_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/roles/role-uuid-1/permissions')
      .send({});
    expect(res.status).toBe(400);
  });
});
