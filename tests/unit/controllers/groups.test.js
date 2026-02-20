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

jest.mock('../../../src/server/models/Group');

const request = require('supertest');
const app = require('../../../src/server/app');
const Group = require('../../../src/server/models/Group');

const SAMPLE_GROUP = {
  id: 'group-uuid-1',
  name: 'Sales Team',
  description: 'Sales department',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/groups', () => {
  test('returns list of groups', async () => {
    Group.list.mockResolvedValue([SAMPLE_GROUP]);
    const res = await request(app).get('/api/v1/groups');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Sales Team');
  });
});

describe('GET /api/v1/groups/:id', () => {
  test('returns group with members and roles', async () => {
    Group.findById.mockResolvedValue(SAMPLE_GROUP);
    Group.getMembers.mockResolvedValue([]);
    Group.getRoles.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/groups/group-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Sales Team');
  });

  test('returns 404 when group not found', async () => {
    Group.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/groups/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/groups', () => {
  test('creates group and returns 201', async () => {
    Group.create.mockResolvedValue(SAMPLE_GROUP);
    const res = await request(app)
      .post('/api/v1/groups')
      .send({ name: 'Sales Team' });
    expect(res.status).toBe(201);
  });

  test('returns 422 when name is missing', async () => {
    const res = await request(app).post('/api/v1/groups').send({});
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/groups/:id', () => {
  test('updates group', async () => {
    Group.findById.mockResolvedValue(SAMPLE_GROUP);
    Group.update.mockResolvedValue({ ...SAMPLE_GROUP, name: 'Updated' });
    const res = await request(app)
      .put('/api/v1/groups/group-uuid-1')
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent group', async () => {
    Group.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/groups/bad-id').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/groups/:id', () => {
  test('deletes group', async () => {
    Group.findById.mockResolvedValue(SAMPLE_GROUP);
    Group.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/groups/group-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent group', async () => {
    Group.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/groups/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/groups/:id/members', () => {
  test('returns group members', async () => {
    Group.getMembers.mockResolvedValue([{ id: 'u1', username: 'alice' }]);
    const res = await request(app).get('/api/v1/groups/group-uuid-1/members');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/v1/groups/:id/members', () => {
  test('adds member to group', async () => {
    Group.addMember.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/groups/group-uuid-1/members')
      .send({ user_id: 'user-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when user_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/groups/group-uuid-1/members')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/groups/:id/roles', () => {
  test('assigns role to group', async () => {
    Group.assignRole.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/groups/group-uuid-1/roles')
      .send({ role_id: 'role-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when role_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/groups/group-uuid-1/roles')
      .send({});
    expect(res.status).toBe(400);
  });
});
