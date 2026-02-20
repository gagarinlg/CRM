'use strict';

const { body } = require('express-validator');
const Role = require('../models/Role');
const { success, error, notFound } = require('../utils/response');

const createValidation = [
  body('name').notEmpty().withMessage('Role name is required.'),
];

const rolesController = {
  createValidation,

  async list(req, res, next) {
    try {
      const roles = await Role.list();
      return success(res, roles);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return notFound(res, 'Role not found.');
      const permissions = await Role.getPermissions(req.params.id);
      return success(res, { ...role, permissions });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const role = await Role.create({ name, description });
      return success(res, role, 'Role created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Role.findById(req.params.id);
      if (!existing) return notFound(res, 'Role not found.');
      const role = await Role.update(req.params.id, req.body);
      return success(res, role, 'Role updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Role.findById(req.params.id);
      if (!existing) return notFound(res, 'Role not found.');
      if (existing.is_system) return error(res, 'Cannot delete a system role.', 400);
      await Role.delete(req.params.id);
      return success(res, null, 'Role deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async listPermissions(req, res, next) {
    try {
      const permissions = await Role.listPermissions();
      return success(res, permissions);
    } catch (err) {
      return next(err);
    }
  },

  async getRolePermissions(req, res, next) {
    try {
      const permissions = await Role.getPermissions(req.params.id);
      return success(res, permissions);
    } catch (err) {
      return next(err);
    }
  },

  async assignPermission(req, res, next) {
    try {
      const { permission_id } = req.body;
      if (!permission_id) return error(res, 'permission_id is required.', 400);
      await Role.assignPermission(req.params.id, permission_id);
      return success(res, null, 'Permission assigned.');
    } catch (err) {
      return next(err);
    }
  },

  async removePermission(req, res, next) {
    try {
      await Role.removePermission(req.params.id, req.params.permissionId);
      return success(res, null, 'Permission removed.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = rolesController;
