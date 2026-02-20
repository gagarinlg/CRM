'use strict';

const { validationResult } = require('express-validator');

/**
 * Run express-validator result check.
 * Returns 422 with structured error array if any validation rules failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  return next();
}

module.exports = { validate };
