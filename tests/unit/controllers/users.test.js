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
    req.user = { id: 'current-user-id', email: 'admin@example.com', roles: ['admin'], permissions: [] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

jest.mock('../../../src/server/models/User');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const User = require('../../../src/server/models/User');

const SAMPLE_USER = {
  id: 'user-uuid-1',
  email: 'john@example.com',
  username: 'john',
  is_active: true,
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/users', () => {
  test('returns paginated user list with roles', async () => {
    User.list.mockResolvedValue({ data: [SAMPLE_USER], total: 1 });
    User.getUserRolesBatch.mockResolvedValue({ 'user-uuid-1': [{ id: 'role-1', name: 'Admin' }] });
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(res.body.data[0].username).toBe('john');
    expect(res.body.data[0].roles[0].name).toBe('Admin');
  });
});

describe('GET /api/v1/users/:id', () => {
  test('returns user with roles and permissions', async () => {
    User.findById.mockResolvedValue(SAMPLE_USER);
    User.getUserRoles.mockResolvedValue(['admin']);
    User.getUserPermissions.mockResolvedValue(['contacts.read']);
    const res = await request(app).get('/api/v1/users/user-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('john');
  });

  test('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/users/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/users', () => {
  test('creates user and returns 201', async () => {
    User.create.mockResolvedValue(SAMPLE_USER);
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'john@example.com', username: 'john', password: 'secret123' });
    expect(res.status).toBe(201);
  });

  test('returns 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'not-email', username: 'john', password: 'secret123' });
    expect(res.status).toBe(422);
  });

  test('returns 422 for short username', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'john@example.com', username: 'ab', password: 'secret123' });
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/users/:id', () => {
  test('updates user and returns 200', async () => {
    User.findById.mockResolvedValue(SAMPLE_USER);
    User.update.mockResolvedValue({ ...SAMPLE_USER, username: 'johnny' });
    const res = await request(app)
      .put('/api/v1/users/user-uuid-1')
      .send({ username: 'johnny' });
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent user', async () => {
    User.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/users/bad-id').send({ username: 'validname' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/users/:id', () => {
  test('soft-deletes user', async () => {
    User.findById.mockResolvedValue({ ...SAMPLE_USER, id: 'other-user-id' });
    User.softDelete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/users/other-user-id');
    expect(res.status).toBe(200);
  });

  test('returns 400 when trying to delete own account', async () => {
    User.findById.mockResolvedValue({ ...SAMPLE_USER, id: 'current-user-id' });
    const res = await request(app).delete('/api/v1/users/current-user-id');
    expect(res.status).toBe(400);
  });

  test('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/users/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/users/:id/roles', () => {
  test('assigns role to user', async () => {
    User.assignRole.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/users/user-uuid-1/roles')
      .send({ role_id: 'role-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when role_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/users/user-uuid-1/roles')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/users/:id/roles', () => {
  test('returns user roles', async () => {
    User.getUserRoles.mockResolvedValue(['admin', 'manager']);
    const res = await request(app).get('/api/v1/users/user-uuid-1/roles');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
