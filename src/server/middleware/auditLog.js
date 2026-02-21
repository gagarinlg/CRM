'use strict';

const { db } = require('../config/database');
const logger = require('../config/logger');

/**
 * Write a row to the audit_logs table.
 *
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {string} opts.action
 * @param {string|null} opts.entityType
 * @param {string|null} opts.entityId
 * @param {object|null} opts.oldValues
 * @param {object|null} opts.newValues
 * @param {string|null} opts.ipAddress
 * @param {string|null} opts.userAgent
 * @returns {Promise<void>}
 */
async function createAuditLog({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await db('audit_logs').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (err) {
    logger.error('Failed to write audit log:', { error: err.message, action, entityType });
  }
}

/**
 * Express middleware factory that creates an audit log entry for each request.
 *
 * @param {string} action - e.g. 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} entityType - e.g. 'contact', 'company'
 * @returns {import('express').RequestHandler}
 */
function auditMiddleware(action, entityType) {
  return async (req, _res, next) => {
    const userId = req.user ? req.user.id : null;
    const entityId = req.params.id || null;
    const ipAddress = req.ip || null;
    const userAgent = req.get('User-Agent') || null;

    await createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      newValues: req.body && Object.keys(req.body).length ? req.body : null,
      ipAddress,
      userAgent,
    });

    next();
  };
}

module.exports = { createAuditLog, auditMiddleware };
