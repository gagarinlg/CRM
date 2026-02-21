'use strict';

const logger = require('../config/logger');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Centralized Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return res.status(401).json({ status: 'error', message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'error', message: 'Token expired.' });
  }

  // express-validator (should be caught by validate middleware, but just in case)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON payload.' });
  }

  // PostgreSQL unique-constraint violation
  if (err.code === '23505') {
    const detail = err.detail || '';
    const match = detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    const value = match ? match[2] : '';
    return res.status(409).json({
      status: 'error',
      message: `A record with this ${field} (${value}) already exists.`,
    });
  }

  // PostgreSQL foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({ status: 'error', message: 'Related record not found.' });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    return res.status(400).json({
      status: 'error',
      message: `Column "${err.column}" cannot be null.`,
    });
  }

  // Validation / explicit HTTP errors thrown by application code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Generic 500
  const message = isProd ? 'An unexpected error occurred.' : err.message;
  return res.status(500).json({ status: 'error', message });
}

module.exports = errorHandler;
