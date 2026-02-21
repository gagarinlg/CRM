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

jest.mock('../../../src/server/models/Tag');

const request = require('supertest');
const app = require('../../../src/server/app');
const Tag = require('../../../src/server/models/Tag');

const SAMPLE_TAG = { id: 'tag-uuid-1', name: 'Hot Lead', color: '#ef4444' };

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/tags', () => {
  test('returns list of tags', async () => {
    Tag.list.mockResolvedValue([SAMPLE_TAG]);
    const res = await request(app).get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Hot Lead');
  });
});

describe('POST /api/v1/tags', () => {
  test('creates a tag and returns 201', async () => {
    Tag.create.mockResolvedValue(SAMPLE_TAG);
    const res = await request(app).post('/api/v1/tags').send({ name: 'Hot Lead', color: '#ef4444' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Hot Lead');
  });

  test('returns 422 when name is missing', async () => {
    const res = await request(app).post('/api/v1/tags').send({});
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/tags/:id', () => {
  test('updates a tag and returns 200', async () => {
    Tag.findById.mockResolvedValue(SAMPLE_TAG);
    Tag.update.mockResolvedValue({ ...SAMPLE_TAG, name: 'Cold Lead' });
    const res = await request(app).put('/api/v1/tags/tag-uuid-1').send({ name: 'Cold Lead' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Cold Lead');
  });

  test('returns 404 when tag not found', async () => {
    Tag.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/tags/bad-id').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/tags/:id', () => {
  test('deletes a tag and returns 200', async () => {
    Tag.findById.mockResolvedValue(SAMPLE_TAG);
    Tag.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/tags/tag-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 404 when tag not found', async () => {
    Tag.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/tags/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/tags/:entityType/:entityId', () => {
  test('returns tags for an entity', async () => {
    Tag.getTagsForEntity.mockResolvedValue([SAMPLE_TAG]);
    const res = await request(app).get('/api/v1/tags/project/proj-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Hot Lead');
  });
});

describe('POST /api/v1/tags/:entityType/:entityId', () => {
  test('adds a tag to an entity', async () => {
    Tag.findById.mockResolvedValue(SAMPLE_TAG);
    Tag.addTagToEntity.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/v1/tags/project/proj-uuid-1')
      .send({ tag_id: 'tag-uuid-1' });
    expect(res.status).toBe(200);
  });

  test('returns 400 when tag_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/tags/project/proj-uuid-1')
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 when tag not found', async () => {
    Tag.findById.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/tags/project/proj-uuid-1')
      .send({ tag_id: 'bad-tag-id' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/tags/:entityType/:entityId/:tagId', () => {
  test('removes a tag from an entity', async () => {
    Tag.removeTagFromEntity.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/tags/project/proj-uuid-1/tag-uuid-1');
    expect(res.status).toBe(200);
  });
});
