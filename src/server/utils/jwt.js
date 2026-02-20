'use strict';

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate a short-lived access token.
 * @param {object} payload - Data to encode (do NOT include sensitive fields).
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    issuer: 'crm-api',
  });
}

/**
 * Generate a long-lived refresh token.
 * @param {object} payload
 * @returns {string}
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    issuer: 'crm-api',
  });
}

/**
 * Verify and decode an access token.
 * @param {string} token
 * @returns {object} Decoded payload.
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { issuer: 'crm-api' });
}

/**
 * Verify and decode a refresh token.
 * @param {string} token
 * @returns {object} Decoded payload.
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, { issuer: 'crm-api' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
