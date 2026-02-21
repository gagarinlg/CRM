'use strict';

const { body } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const updateValidation = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
];

const usersController = {
  createValidation,
  updateValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, is_active, role } = req.query;
      const result = await User.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        role,
      });
      return paginated(res, result.data, result.total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return notFound(res, 'User not found.');
      const roles = await User.getUserRoles(req.params.id);
      const permissions = await User.getUserPermissions(req.params.id);
      return success(res, { ...user, roles, permissions });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const user = await User.create(req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'create_user',
        entity_type: 'user',
        entity_id: user.id,
        new_values: user,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });
      return success(res, user, 'User created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await User.findById(req.params.id);
      if (!existing) return notFound(res, 'User not found.');

      const user = await User.update(req.params.id, req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'update_user',
        entity_type: 'user',
        entity_id: req.params.id,
        old_values: existing,
        new_values: user,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });
      return success(res, user, 'User updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await User.findById(req.params.id);
      if (!existing) return notFound(res, 'User not found.');
      if (req.params.id === req.user.id) return error(res, 'Cannot delete your own account.', 400);

      await User.softDelete(req.params.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'delete_user',
        entity_type: 'user',
        entity_id: req.params.id,
        ip_address: req.ip,
      });
      return success(res, null, 'User deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async assignRole(req, res, next) {
    try {
      const { role_id } = req.body;
      if (!role_id) return error(res, 'role_id is required.', 400);
      await User.assignRole(req.params.id, role_id);
      return success(res, null, 'Role assigned.');
    } catch (err) {
      return next(err);
    }
  },

  async removeRole(req, res, next) {
    try {
      await User.removeRole(req.params.id, req.params.roleId);
      return success(res, null, 'Role removed.');
    } catch (err) {
      return next(err);
    }
  },

  async getRoles(req, res, next) {
    try {
      const roles = await User.getUserRoles(req.params.id);
      return success(res, roles);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = usersController;
