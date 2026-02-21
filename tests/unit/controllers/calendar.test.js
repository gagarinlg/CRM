'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';

jest.mock('../../../src/server/config/database', () => ({
  db: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

// Default mock: authenticated admin user who owns the event
jest.mock('../../../src/server/middleware/auth', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'owner-user-id', email: 'admin@example.com', roles: ['Admin'], permissions: ['calendar.read', 'calendar.write', 'calendar.delete'] };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requirePermission: () => (_req, _res, next) => next(),
}));

jest.mock('../../../src/server/models/Event');

const request = require('supertest');
const app = require('../../../src/server/app');
const Event = require('../../../src/server/models/Event');

const SAMPLE_EVENT = {
  id: 'event-uuid-1',
  title: 'Team standup',
  start_datetime: '2026-02-01T09:00:00.000Z',
  end_datetime: '2026-02-01T09:30:00.000Z',
  type: 'meeting',
  created_by: 'owner-user-id',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/calendar', () => {
  test('returns event list', async () => {
    Event.listByDateRange.mockResolvedValue([SAMPLE_EVENT]);
    const res = await request(app).get('/api/v1/calendar');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Team standup');
  });
});

describe('POST /api/v1/calendar', () => {
  test('creates event and returns 201', async () => {
    Event.create.mockResolvedValue(SAMPLE_EVENT);
    const res = await request(app)
      .post('/api/v1/calendar')
      .send({
        title: 'Team standup',
        start_datetime: '2026-02-01T09:00:00.000Z',
        end_datetime: '2026-02-01T09:30:00.000Z',
      });
    expect(res.status).toBe(201);
  });

  test('returns 422 when title is missing', async () => {
    const res = await request(app)
      .post('/api/v1/calendar')
      .send({ start_datetime: '2026-02-01T09:00:00.000Z', end_datetime: '2026-02-01T09:30:00.000Z' });
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/calendar/:id — ownership', () => {
  test('owner can update their own event', async () => {
    Event.findById.mockResolvedValue({ ...SAMPLE_EVENT, created_by: 'owner-user-id' });
    Event.update.mockResolvedValue({ ...SAMPLE_EVENT, title: 'Updated standup' });
    const res = await request(app)
      .put('/api/v1/calendar/event-uuid-1')
      .send({ title: 'Updated standup' });
    expect(res.status).toBe(200);
  });

  test('admin/manager can update an event they do not own', async () => {
    // req.user has role 'Admin' — isAdminOrManager must be true
    Event.findById.mockResolvedValue({ ...SAMPLE_EVENT, created_by: 'someone-else' });
    Event.update.mockResolvedValue(SAMPLE_EVENT);
    const res = await request(app)
      .put('/api/v1/calendar/event-uuid-1')
      .send({ title: 'Admin edit' });
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent event', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).put('/api/v1/calendar/bad-id').send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/calendar/:id — ownership', () => {
  test('owner can delete their own event', async () => {
    Event.findById.mockResolvedValue({ ...SAMPLE_EVENT, created_by: 'owner-user-id' });
    Event.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/calendar/event-uuid-1');
    expect(res.status).toBe(200);
  });

  test('admin/manager can delete an event they do not own', async () => {
    Event.findById.mockResolvedValue({ ...SAMPLE_EVENT, created_by: 'someone-else' });
    Event.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/v1/calendar/event-uuid-1');
    expect(res.status).toBe(200);
  });

  test('returns 404 for non-existent event', async () => {
    Event.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/calendar/bad-id');
    expect(res.status).toBe(404);
  });
});
