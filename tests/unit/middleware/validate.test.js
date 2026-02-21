'use strict';

// Must be hoisted before any require of the middleware
jest.mock('express-validator', () => {
  const original = jest.requireActual('express-validator');
  return { ...original, validationResult: jest.fn() };
});

const { validationResult } = require('express-validator');
const { validate } = require('../../../src/server/middleware/validate');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('validate middleware', () => {
  test('calls next() when there are no validation errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    validate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 422 with error details when validation fails', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'email', msg: 'Invalid email', value: 'bad' }],
    });
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    validate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Validation failed.',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'email', message: 'Invalid email' }),
        ]),
      })
    );
  });

  test('uses e.param as fallback when e.path is undefined', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ param: 'name', msg: 'Required', value: '' }],
    });
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    validate(req, res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.errors[0].field).toBe('name');
  });
});
