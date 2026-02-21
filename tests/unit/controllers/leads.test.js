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

jest.mock('../../../src/server/models/Lead');
jest.mock('../../../src/server/models/Project');
jest.mock('../../../src/server/models/Note');
jest.mock('../../../src/server/models/Attachment');
jest.mock('../../../src/server/models/AuditLog', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-id' }),
  list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
}));

// Mock the db() calls used in leadsController
const { db } = require('../../../src/server/config/database');

function makeDbChain(overrides = {}) {
  const chain = {
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    select: jest.fn().mockResolvedValue([]),
    pluck: jest.fn().mockResolvedValue([]),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return chain;
}

db.mockReturnValue(makeDbChain());

const request = require('supertest');
const app = require('../../../src/server/app');
const Lead = require('../../../src/server/models/Lead');
const Project = require('../../../src/server/models/Project');
const Note = require('../../../src/server/models/Note');
const Attachment = require('../../../src/server/models/Attachment');
const AuditLog = require('../../../src/server/models/AuditLog');

const SAMPLE_LEAD = {
  id: 'lead-uuid-1',
  title: 'Big Deal',
  value: 50000,
  status: 'open',
  stage: 'qualified',
  visibility: 'public',
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
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
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

describe('GET /api/v1/leads/:id/groups', () => {
  test('returns groups for lead', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    Lead.getGroups.mockResolvedValue([{ id: 'g1', name: 'Sales' }]);
    const res = await request(app).get('/api/v1/leads/lead-uuid-1/groups');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Sales');
  });

  test('returns 404 when lead not found', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/leads/bad-id/groups');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/leads/:id/groups', () => {
  test('adds group to lead', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    Lead.addGroup.mockResolvedValue();
    const res = await request(app)
      .post('/api/v1/leads/lead-uuid-1/groups')
      .send({ group_id: 'g1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when group_id missing', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    const res = await request(app)
      .post('/api/v1/leads/lead-uuid-1/groups')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/leads/:id/groups/:groupId', () => {
  test('removes group from lead', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    Lead.removeGroup.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/leads/lead-uuid-1/groups/g1');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/leads/:id/convert', () => {
  const PROJECT = { id: 'proj-uuid-1', name: 'Big Deal', status: 'planning' };

  test('converts open lead to project', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, contact_id: null });
    Lead.getGroups.mockResolvedValue([]);
    Lead.getContacts.mockResolvedValue([]);
    Lead.getMembers.mockResolvedValue([]);
    Lead.update.mockResolvedValue({ ...SAMPLE_LEAD, status: 'won' });
    Project.create.mockResolvedValue(PROJECT);
    Project.addContact = jest.fn().mockResolvedValue();
    Project.addGroup = jest.fn().mockResolvedValue();
    Note.listByEntity = jest.fn().mockResolvedValue([]);
    Attachment.listByEntity = jest.fn().mockResolvedValue([]);
    const res = await request(app).post('/api/v1/leads/lead-uuid-1/convert');
    expect(res.status).toBe(201);
    expect(res.body.data.project_id).toBe('proj-uuid-1');
  });

  test('copies contact and groups when converting', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, contact_id: 'c1' });
    Lead.getGroups.mockResolvedValue([{ id: 'g1', name: 'Sales' }]);
    Lead.getContacts.mockResolvedValue([{ contact_id: 'c1' }]);
    Lead.getMembers.mockResolvedValue([]);
    Lead.update.mockResolvedValue({ ...SAMPLE_LEAD, status: 'won' });
    Project.create.mockResolvedValue(PROJECT);
    Project.addContact = jest.fn().mockResolvedValue();
    Project.addGroup = jest.fn().mockResolvedValue();
    Note.listByEntity = jest.fn().mockResolvedValue([]);
    Attachment.listByEntity = jest.fn().mockResolvedValue([]);
    const res = await request(app).post('/api/v1/leads/lead-uuid-1/convert');
    expect(res.status).toBe(201);
    expect(Project.addContact).toHaveBeenCalledWith(PROJECT.id, 'c1');
    expect(Project.addGroup).toHaveBeenCalledWith(PROJECT.id, 'g1');
  });

  test('returns 400 for already-won lead', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, status: 'won' });
    const res = await request(app).post('/api/v1/leads/lead-uuid-1/convert');
    expect(res.status).toBe(400);
  });

  test('returns 400 for already-lost lead', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, status: 'lost' });
    const res = await request(app).post('/api/v1/leads/lead-uuid-1/convert');
    expect(res.status).toBe(400);
  });

  test('returns 404 when lead not found', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/leads/bad-id/convert');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/leads/:id (restricted visibility)', () => {
  const leadsController = require('../../../src/server/controllers/leadsController');

  function makeReq(userId, roles = []) {
    return {
      params: { id: 'lead-uuid-1' },
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

  test('admin user always has access to restricted lead', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'restricted', created_by: 'someone-else' });
    const req = makeReq('test-user-id', ['admin']);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('creator has access to their own restricted lead', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'restricted', created_by: 'test-user-id' });
    const req = makeReq('test-user-id', []);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('assigned_to user has access to restricted lead', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'restricted', created_by: 'owner-id', assigned_to: 'assigned-user' });
    const req = makeReq('assigned-user', []);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 404 for non-admin non-creator without group/member access', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'restricted', created_by: 'owner-id', assigned_to: 'other' });
    db.mockReturnValue(makeDbChain({
      pluck: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockResolvedValue([]),
      first: jest.fn().mockResolvedValue(null),
    }));
    const req = makeReq('nobody', []);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('group member has access to restricted lead via group membership', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'restricted', created_by: 'owner-id', assigned_to: null });
    const chain = makeDbChain();
    chain.pluck = jest.fn().mockResolvedValue(['grp-1']);
    chain.first = jest.fn().mockResolvedValue({ group_id: 'grp-1' });
    db.mockReturnValue(chain);
    const req = makeReq('group-member', []);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('public lead is accessible to any authenticated user', async () => {
    Lead.findById.mockResolvedValue({ ...SAMPLE_LEAD, visibility: 'public' });
    const req = makeReq('any-user', []);
    const res = mockRes();
    await leadsController.getById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('GET /api/v1/leads/:id/activity', () => {
  test('returns activity log for lead', async () => {
    Lead.findById.mockResolvedValue(SAMPLE_LEAD);
    AuditLog.list.mockResolvedValue({ data: [{ id: 'log-1', action: 'create_lead' }], total: 1 });
    const res = await request(app).get('/api/v1/leads/lead-uuid-1/activity');
    expect(res.status).toBe(200);
    expect(res.body.data[0].action).toBe('create_lead');
  });

  test('returns 404 when lead not found', async () => {
    Lead.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/leads/bad-id/activity');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/leads/bulk-delete', () => {
  beforeEach(() => {
    db.mockReturnValue(makeDbChain());
  });

  test('bulk deletes leads by ids', async () => {
    const res = await request(app)
      .post('/api/v1/leads/bulk-delete')
      .send({ ids: ['lead-uuid-1', 'lead-uuid-2'] });
    expect(res.status).toBe(200);
  });

  test('returns 400 when ids is missing', async () => {
    const res = await request(app)
      .post('/api/v1/leads/bulk-delete')
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when ids is empty array', async () => {
    const res = await request(app)
      .post('/api/v1/leads/bulk-delete')
      .send({ ids: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/leads/export', () => {
  test('returns CSV data', async () => {
    Lead.list.mockResolvedValue({ data: [SAMPLE_LEAD], total: 1 });
    const res = await request(app).get('/api/v1/leads/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id,title,value');
  });
});

