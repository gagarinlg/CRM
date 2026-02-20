'use strict';

const {
  success,
  error,
  paginated,
  notFound,
  unauthorized,
  forbidden,
} = require('../../../src/server/utils/response');

// Helper to create a mock Express response object
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('response utilities', () => {
  describe('success()', () => {
    test('returns HTTP 200 with status:success', () => {
      const res = mockRes();
      success(res, { id: 1 }, 'Created OK', 200);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', data: { id: 1 }, message: 'Created OK' }),
      );
    });

    test('defaults to status code 200', () => {
      const res = mockRes();
      success(res, null);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('supports custom 201 status code', () => {
      const res = mockRes();
      success(res, { id: 2 }, 'Created', 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('error()', () => {
    test('returns HTTP 400 by default', () => {
      const res = mockRes();
      error(res, 'Bad input');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', message: 'Bad input' }),
      );
    });

    test('supports custom status codes', () => {
      const res = mockRes();
      error(res, 'Conflict', 409);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('includes errors array when provided', () => {
      const res = mockRes();
      error(res, 'Validation failed', 422, [{ field: 'name', message: 'required' }]);
      const body = res.json.mock.calls[0][0];
      expect(body.errors).toHaveLength(1);
    });
  });

  describe('notFound()', () => {
    test('returns HTTP 404', () => {
      const res = mockRes();
      notFound(res, 'Not found');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json.mock.calls[0][0].status).toBe('error');
    });
  });

  describe('unauthorized()', () => {
    test('returns HTTP 401', () => {
      const res = mockRes();
      unauthorized(res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forbidden()', () => {
    test('returns HTTP 403', () => {
      const res = mockRes();
      forbidden(res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('paginated()', () => {
    test('returns pagination metadata', () => {
      const res = mockRes();
      paginated(res, [{ id: 1 }, { id: 2 }], 100, 1, 20);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toMatchObject({
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    test('hasPrevPage is true when page > 1', () => {
      const res = mockRes();
      paginated(res, [], 100, 3, 20);
      const { pagination } = res.json.mock.calls[0][0];
      expect(pagination.hasPrevPage).toBe(true);
    });

    test('hasNextPage is false on last page', () => {
      const res = mockRes();
      paginated(res, [], 20, 1, 20);
      const { pagination } = res.json.mock.calls[0][0];
      expect(pagination.hasNextPage).toBe(false);
    });
  });
});
