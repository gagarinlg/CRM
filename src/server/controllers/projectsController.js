'use strict';

const { body } = require('express-validator');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated, notFound } = require('../utils/response');
const { db } = require('../config/database');

const MAX_EXPORT_ROWS = 10000;

const createValidation = [
  body('name').notEmpty().withMessage('Project name is required.'),
  body('status').optional({ checkFalsy: true }).isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Status must be one of: planning, active, on_hold, completed, cancelled.'),
  body('budget').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Budget must be a non-negative number.'),
];

function hasAdminRole(user) {
  return user.roles && user.roles.some(r =>
    ['admin', 'manager'].includes((r.name || r).toLowerCase()),
  );
}

async function checkProjectAccess(user, project) {
  if (project.visibility !== 'restricted') return true;
  if (hasAdminRole(user)) return true;
  if (project.created_by === user.id) return true;
  const userGroups = await db('group_members').where({ user_id: user.id }).pluck('group_id');
  if (userGroups.length > 0) {
    const matched = await db('project_groups')
      .where('project_id', project.id)
      .whereIn('group_id', userGroups)
      .first();
    if (matched) return true;
  }
  const isMember = await db('project_members')
    .where({ project_id: project.id, user_id: user.id })
    .first();
  return !!isMember;
}

const projectsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status, company_id, sort, order } = req.query;
      const isAdmin = hasAdminRole(req.user);
      let user_groups = [];
      if (!isAdmin) {
        user_groups = await db('group_members')
          .where({ user_id: req.user.id })
          .pluck('group_id');
      }
      const result = await Project.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        status,
        company_id,
        sort,
        order,
        user_id: isAdmin ? null : req.user.id,
        user_groups,
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
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');

      const [members, contacts] = await Promise.all([
        Project.getMembers(req.params.id),
        Project.getContacts(req.params.id),
      ]);
      return success(res, { ...project, members, contacts });
    } catch (err) {
      return next(err);
    }
  },

  async getContacts(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      const contacts = await Project.getContacts(req.params.id);
      return success(res, contacts);
    } catch (err) {
      return next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      const members = await Project.getMembers(req.params.id);
      return success(res, members);
    } catch (err) {
      return next(err);
    }
  },

  async getActivity(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      const { page = 1, limit = 20 } = req.query;
      const result = await AuditLog.list({
        entity_type: 'project',
        entity_id: req.params.id,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      return paginated(res, result.data, result.total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      return next(err);
    }
  },

  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return error(res, 'ids array is required.', 400);
      await db('projects').whereIn('id', ids).update({ deleted_at: db.fn.now() });
      await AuditLog.create({
        user_id: req.user.id,
        action: 'bulk_delete_projects',
        entity_type: 'project',
        new_values: { ids },
        ip_address: req.ip,
      });
      return success(res, null, `${ids.length} project(s) deleted.`);
    } catch (err) {
      return next(err);
    }
  },

  async exportCsv(req, res, next) {
    try {
      const isAdmin = hasAdminRole(req.user);
      let user_groups = [];
      if (!isAdmin) {
        user_groups = await db('group_members').where({ user_id: req.user.id }).pluck('group_id');
      }
      const result = await Project.list({
        page: 1,
        limit: MAX_EXPORT_ROWS,
        user_id: isAdmin ? null : req.user.id,
        user_groups,
      });
      const rows = result.data;
      const headers = ['id', 'name', 'status', 'start_date', 'end_date', 'budget', 'progress', 'visibility', 'company_name', 'created_at'];
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="projects.csv"');
      return res.send(csv);
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
      if (!(await checkProjectAccess(req.user, existing))) return notFound(res, 'Project not found.');
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
      if (!(await checkProjectAccess(req.user, existing))) return notFound(res, 'Project not found.');
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
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      await Project.addContact(req.params.id, contact_id);
      return success(res, null, 'Contact added to project.');
    } catch (err) {
      return next(err);
    }
  },

  async removeContact(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
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
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      await Project.addMember(req.params.id, user_id, role);
      return success(res, null, 'Member added to project.');
    } catch (err) {
      return next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
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
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      const notes = await Project.getNotes(req.params.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },

  async getGroups(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      const groups = await Project.getGroups(req.params.id);
      return success(res, groups);
    } catch (err) {
      return next(err);
    }
  },

  async addGroup(req, res, next) {
    try {
      const { group_id } = req.body;
      if (!group_id) return error(res, 'group_id is required.', 400);
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      await Project.addGroup(req.params.id, group_id);
      return success(res, null, 'Group added to project.');
    } catch (err) {
      return next(err);
    }
  },

  async removeGroup(req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return notFound(res, 'Project not found.');
      if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
      await Project.removeGroup(req.params.id, req.params.groupId);
      return success(res, null, 'Group removed from project.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = projectsController;
