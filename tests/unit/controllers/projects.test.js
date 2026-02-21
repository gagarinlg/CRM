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

jest.mock('../../../src/server/models/Project');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
  list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
}));

const request = require('supertest');
const app = require('../../../src/server/app');
const Project = require('../../../src/server/models/Project');
const AuditLog = require('../../../src/server/models/AuditLog');
const { db } = require('../../../src/server/config/database');

const SAMPLE_PROJECT = {
  id: 'proj-uuid-1',
  name: 'CRM Rollout',
  status: 'active',
  company_id: 'company-uuid-1',
  created_at: new Date().toISOString(),
};

function makeDbChain(overrides = {}) {
  const chain = {
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    select: jest.fn().mockResolvedValue([]),
    pluck: jest.fn().mockResolvedValue([]),
    first: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
  return chain;
}

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

describe('GET /api/v1/projects/:id/groups', () => {
  test('returns groups for project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.getGroups.mockResolvedValue([{ id: 'grp-1', name: 'Sales' }]);
    const res = await request(app).get('/api/v1/projects/proj-uuid-1/groups');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Sales');
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/bad-id/groups');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/projects/:id/groups', () => {
  test('adds group to project', async () => {
    Project.addGroup.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/groups')
      .send({ group_id: 'grp-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when group_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/projects/proj-uuid-1/groups')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/projects/:id/groups/:groupId', () => {
  test('removes group from project', async () => {
    Project.removeGroup.mockResolvedValue(1);
    const res = await request(app)
      .delete('/api/v1/projects/proj-uuid-1/groups/grp-1');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/projects/:id (restricted visibility)', () => {
  const projectsController = require('../../../src/server/controllers/projectsController');

  function makeReq(userId, roles = []) {
    return {
      params: { id: 'proj-uuid-1' },
      user: { id: userId, roles, permissions: [] },
      ip: '127.0.0.1',
    };
  }
  function mockRes() {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
  }

  test('admin user always has access to restricted project', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'restricted', created_by: 'someone-else' });
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const req = makeReq('test-user-id', ['admin']);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('creator has access to their own restricted project', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'restricted', created_by: 'test-user-id' });
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const req = makeReq('test-user-id', []);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 403 for non-admin non-creator without group/member access', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'restricted', created_by: 'owner-id' });
    db.mockReturnValue(makeDbChain({ pluck: jest.fn().mockResolvedValue([]), select: jest.fn().mockResolvedValue([]), first: jest.fn().mockResolvedValue(null) }));
    const req = makeReq('other-user', []);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('group member has access to restricted project via group membership', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'restricted', created_by: 'owner-id' });
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const chain = makeDbChain();
    chain.pluck = jest.fn().mockResolvedValue(['grp-1']);
    chain.select = jest.fn().mockResolvedValue([{ group_id: 'grp-1' }]);
    db.mockReturnValue(chain);
    const req = makeReq('group-member', []);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('direct project member has access to restricted project', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'restricted', created_by: 'owner-id' });
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const chain = makeDbChain();
    chain.pluck = jest.fn().mockResolvedValue([]);
    chain.select = jest.fn().mockResolvedValue([]);
    chain.first = jest.fn().mockResolvedValue({ user_id: 'member-user' });
    db.mockReturnValue(chain);
    const req = makeReq('member-user', []);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('public project is accessible to any authenticated user', async () => {
    Project.findById.mockResolvedValue({ ...SAMPLE_PROJECT, visibility: 'public' });
    Project.getMembers.mockResolvedValue([]);
    Project.getContacts.mockResolvedValue([]);
    const req = makeReq('any-user', []);
    const res = mockRes();
    await projectsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('GET /api/v1/projects/:id/contacts', () => {
  test('returns contacts for project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.getContacts.mockResolvedValue([{ id: 'c1', first_name: 'Alice', last_name: 'Smith' }]);
    const res = await request(app).get('/api/v1/projects/proj-uuid-1/contacts');
    expect(res.status).toBe(200);
    expect(res.body.data[0].first_name).toBe('Alice');
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/bad-id/contacts');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/projects/:id/members', () => {
  test('returns members for project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    Project.getMembers.mockResolvedValue([{ id: 'u1', email: 'bob@example.com', role: 'developer' }]);
    const res = await request(app).get('/api/v1/projects/proj-uuid-1/members');
    expect(res.status).toBe(200);
    expect(res.body.data[0].email).toBe('bob@example.com');
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/bad-id/members');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/projects/:id/activity', () => {
  test('returns activity log for project', async () => {
    Project.findById.mockResolvedValue(SAMPLE_PROJECT);
    AuditLog.list.mockResolvedValue({ data: [{ id: 'log-1', action: 'create_project' }], total: 1 });
    const res = await request(app).get('/api/v1/projects/proj-uuid-1/activity');
    expect(res.status).toBe(200);
    expect(res.body.data[0].action).toBe('create_project');
  });

  test('returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/projects/bad-id/activity');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/projects/bulk-delete', () => {
  beforeEach(() => {
    db.mockReturnValue(makeDbChain());
  });

  test('bulk deletes projects by ids', async () => {
    const res = await request(app)
      .post('/api/v1/projects/bulk-delete')
      .send({ ids: ['proj-uuid-1', 'proj-uuid-2'] });
    expect(res.status).toBe(200);
  });

  test('returns 400 when ids is missing', async () => {
    const res = await request(app)
      .post('/api/v1/projects/bulk-delete')
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when ids is empty array', async () => {
    const res = await request(app)
      .post('/api/v1/projects/bulk-delete')
      .send({ ids: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/projects/export', () => {
  test('returns CSV data', async () => {
    Project.list.mockResolvedValue({ data: [SAMPLE_PROJECT], total: 1 });
    const res = await request(app).get('/api/v1/projects/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id,name,status');
  });
});

