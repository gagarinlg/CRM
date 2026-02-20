'use strict';

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode=200]
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', message, data });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} [message]
 * @param {number} [statusCode=400]
 * @param {Array|null} [errors]
 */
function error(res, message = 'Bad request', statusCode = 400, errors = null) {
  const body = { status: 'error', message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Send a paginated list response.
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {number} total - Total record count.
 * @param {number} page - Current page (1-based).
 * @param {number} limit - Records per page.
 * @param {string} [message]
 */
function paginated(res, data, total, page, limit, message = 'Success') {
  return res.status(200).json({
    status: 'success',
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
}

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function notFound(res, message = 'Resource not found.') {
  return res.status(404).json({ status: 'error', message });
}

/**
 * Send a 401 Unauthorized response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function unauthorized(res, message = 'Unauthorized.') {
  return res.status(401).json({ status: 'error', message });
}

/**
 * Send a 403 Forbidden response.
 * @param {import('express').Response} res
 * @param {string} [message]
 */
function forbidden(res, message = 'Forbidden.') {
  return res.status(403).json({ status: 'error', message });
}

module.exports = { success, error, paginated, notFound, unauthorized, forbidden };
