'use strict';

const { body } = require('express-validator');
const Group = require('../models/Group');
const { success, error, notFound } = require('../utils/response');

const createValidation = [
  body('name').notEmpty().withMessage('Group name is required.'),
];

const groupsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const groups = await Group.list({ search: req.query.search });
      return success(res, groups);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return notFound(res, 'Group not found.');
      const [members, roles] = await Promise.all([
        Group.getMembers(req.params.id),
        Group.getRoles(req.params.id),
      ]);
      return success(res, { ...group, members, roles });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const group = await Group.create({ ...req.body, created_by: req.user.id });
      return success(res, group, 'Group created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Group.findById(req.params.id);
      if (!existing) return notFound(res, 'Group not found.');
      const group = await Group.update(req.params.id, req.body);
      return success(res, group, 'Group updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Group.findById(req.params.id);
      if (!existing) return notFound(res, 'Group not found.');
      await Group.delete(req.params.id);
      return success(res, null, 'Group deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const { user_id } = req.body;
      if (!user_id) return error(res, 'user_id is required.', 400);
      await Group.addMember(req.params.id, user_id);
      return success(res, null, 'Member added.');
    } catch (err) {
      return next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      await Group.removeMember(req.params.id, req.params.userId);
      return success(res, null, 'Member removed.');
    } catch (err) {
      return next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const members = await Group.getMembers(req.params.id);
      return success(res, members);
    } catch (err) {
      return next(err);
    }
  },

  async assignRole(req, res, next) {
    try {
      const { role_id } = req.body;
      if (!role_id) return error(res, 'role_id is required.', 400);
      await Group.assignRole(req.params.id, role_id);
      return success(res, null, 'Role assigned to group.');
    } catch (err) {
      return next(err);
    }
  },

  async removeRole(req, res, next) {
    try {
      await Group.removeRole(req.params.id, req.params.roleId);
      return success(res, null, 'Role removed from group.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = groupsController;
