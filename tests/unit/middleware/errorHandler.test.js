'use strict';

const errorHandler = require('../../../src/server/middleware/errorHandler');

function mockReq() {
  return { originalUrl: '/api/v1/test', method: 'GET', ip: '127.0.0.1' };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  beforeEach(() => {
    // Suppress logger output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles JsonWebTokenError as 401', () => {
    const err = Object.assign(new Error('jwt invalid'), { name: 'JsonWebTokenError' });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe('Invalid token.');
  });

  test('handles TokenExpiredError as 401', () => {
    const err = Object.assign(new Error('expired'), { name: 'TokenExpiredError' });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe('Token expired.');
  });

  test('handles PostgreSQL unique-constraint (23505) as 409', () => {
    const err = Object.assign(new Error('unique violation'), {
      code: '23505',
      detail: '(email)=(test@example.com)',
    });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('handles PostgreSQL foreign-key violation (23503) as 400', () => {
    const err = Object.assign(new Error('fk violation'), { code: '23503' });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('handles PostgreSQL not-null violation (23502) as 400', () => {
    const err = Object.assign(new Error('null violation'), { code: '23502', column: 'name' });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('"name"');
  });

  test('uses err.statusCode when present', () => {
    const err = Object.assign(new Error('Not found'), { statusCode: 404 });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe('Not found');
  });

  test('returns 500 for generic unrecognized errors', () => {
    const err = new Error('Something exploded');
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('includes errors array in response when present on error', () => {
    const err = Object.assign(new Error('Validation'), {
      statusCode: 422,
      errors: [{ field: 'email', message: 'required' }],
    });
    const res = mockRes();
    errorHandler(err, mockReq(), res, jest.fn());
    expect(res.json.mock.calls[0][0].errors).toHaveLength(1);
  });
});
