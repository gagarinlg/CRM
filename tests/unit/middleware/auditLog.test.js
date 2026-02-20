'use strict';

process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';

// ── Database mock ─────────────────────────────────────────────────────────────
const mockInsert = jest.fn().mockResolvedValue([1]);
const mockDb = jest.fn(() => ({ insert: mockInsert }));

jest.mock('../../../src/server/config/database', () => ({
  db: mockDb,
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

const { createAuditLog, auditMiddleware } = require('../../../src/server/middleware/auditLog');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('createAuditLog', () => {
  test('inserts an audit log row into the database', async () => {
    await createAuditLog({ userId: 'u1', action: 'test_action', entityType: 'contact', entityId: 'e1' });
    expect(mockDb).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', action: 'test_action', entity_type: 'contact' })
    );
  });

  test('serialises old_values and new_values as JSON', async () => {
    await createAuditLog({
      action: 'update',
      oldValues: { name: 'before' },
      newValues: { name: 'after' },
    });
    const call = mockInsert.mock.calls[0][0];
    expect(call.old_values).toBe(JSON.stringify({ name: 'before' }));
    expect(call.new_values).toBe(JSON.stringify({ name: 'after' }));
  });

  test('stores null for old_values and new_values when not provided', async () => {
    await createAuditLog({ action: 'delete' });
    const call = mockInsert.mock.calls[0][0];
    expect(call.old_values).toBeNull();
    expect(call.new_values).toBeNull();
  });

  test('does not throw when db insert fails (fire-and-forget)', async () => {
    mockInsert.mockRejectedValueOnce(new Error('DB error'));
    await expect(createAuditLog({ action: 'fail_action' })).resolves.toBeUndefined();
  });
});

describe('auditMiddleware', () => {
  test('calls next() after creating an audit log', async () => {
    const middleware = auditMiddleware('CREATE', 'contact');
    const req = {
      user: { id: 'u1' },
      params: { id: 'c1' },
      body: { name: 'Alice' },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Jest/1.0'),
    };
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockDb).toHaveBeenCalledWith('audit_logs');
  });

  test('works when req.user is undefined (unauthenticated context)', async () => {
    const middleware = auditMiddleware('VIEW', 'report');
    const req = {
      params: {},
      body: {},
      ip: '10.0.0.1',
      get: jest.fn().mockReturnValue(undefined),
    };
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const call = mockInsert.mock.calls[0][0];
    expect(call.user_id).toBeNull();
  });

  test('works when req.body is empty', async () => {
    const middleware = auditMiddleware('DELETE', 'user');
    const req = {
      user: { id: 'u2' },
      params: { id: 'usr-1' },
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('curl/7.0'),
    };
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const call = mockInsert.mock.calls[0][0];
    expect(call.new_values).toBeNull();
  });
});
