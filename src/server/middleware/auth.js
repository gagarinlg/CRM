'use strict';

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Verify JWT from Authorization header and attach user to req.
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided.');
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db('users')
      .select('id', 'email', 'username', 'is_active', 'force_password_change')
      .where({ id: decoded.sub, deleted_at: null })
      .first();

    if (!user) {
      return unauthorized(res, 'User not found.');
    }

    if (!user.is_active) {
      return unauthorized(res, 'Account is deactivated.');
    }

    // Load roles and permissions
    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .pluck('roles.name');

    const permissions = await db('user_roles')
      .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', user.id)
      .pluck('permissions.name');

    req.user = {
      ...user,
      roles,
      permissions: [...new Set(permissions)],
    };

    return next();
  } catch (err) {
    logger.warn('Token verification failed:', { error: err.message });
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired.');
    }
    return unauthorized(res, 'Invalid token.');
  }
}

/**
 * Middleware factory – requires at least one of the given roles.
 * @param {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required.');
    }
    const hasRole = roles.some((role) => req.user.roles.includes(role));
    if (!hasRole) {
      return forbidden(res, 'Insufficient role.');
    }
    return next();
  };
}

/**
 * Middleware factory – requires ALL of the given permissions.
 * @param {...string} perms
 */
function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required.');
    }
    const missingPerm = perms.find((p) => !req.user.permissions.includes(p));
    if (missingPerm) {
      return forbidden(res, `Missing permission: ${missingPerm}`);
    }
    return next();
  };
}

module.exports = { verifyToken, requireRole, requirePermission };
