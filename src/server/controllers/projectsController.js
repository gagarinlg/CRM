'use strict';

const { body } = require('express-validator');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('name').notEmpty().withMessage('Project name is required.'),
  body('status').optional({ checkFalsy: true }).isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  body('budget').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

const projectsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status, company_id, sort, order } = req.query;
      const result = await Project.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        status,
        company_id,
        sort,
        order,
      });
      return paginated(res, result.data, result.total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      const [members, contacts] = await Promise.all([
        Project.getMembers(req.params.id),
        Project.getContacts(req.params.id),
      ]);
      return success(res, { ...project, members, contacts });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const project = await Project.create(req.body, req.user.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'create_project',
        entity_type: 'project',
        entity_id: project.id,
        new_values: project,
        ip_address: req.ip,
      });
      return success(res, project, 'Project created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Project.findById(req.params.id);
      if (!existing) return notFound(res, 'Project not found.');
      const project = await Project.update(req.params.id, req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'update_project',
        entity_type: 'project',
        entity_id: req.params.id,
        old_values: existing,
        new_values: project,
        ip_address: req.ip,
      });
      return success(res, project, 'Project updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Project.findById(req.params.id);
      if (!existing) return notFound(res, 'Project not found.');
      await Project.softDelete(req.params.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'delete_project',
        entity_type: 'project',
        entity_id: req.params.id,
        ip_address: req.ip,
      });
      return success(res, null, 'Project deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async addContact(req, res, next) {
    try {
      const { contact_id } = req.body;
      if (!contact_id) return error(res, 'contact_id is required.', 400);
      await Project.addContact(req.params.id, contact_id);
      return success(res, null, 'Contact added to project.');
    } catch (err) {
      return next(err);
    }
  },

  async removeContact(req, res, next) {
    try {
      await Project.removeContact(req.params.id, req.params.contactId);
      return success(res, null, 'Contact removed from project.');
    } catch (err) {
      return next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const { user_id, role } = req.body;
      if (!user_id) return error(res, 'user_id is required.', 400);
      await Project.addMember(req.params.id, user_id, role);
      return success(res, null, 'Member added to project.');
    } catch (err) {
      return next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      await Project.removeMember(req.params.id, req.params.userId);
      return success(res, null, 'Member removed from project.');
    } catch (err) {
      return next(err);
    }
  },

  async getNotes(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      const notes = await Project.getNotes(req.params.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = projectsController;
