'use strict';

const { body } = require('express-validator');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('title').notEmpty().withMessage('Lead title is required.'),
  body('value').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('probability').optional({ checkFalsy: true }).isInt({ min: 0, max: 100 }),
  body('status').optional({ checkFalsy: true }).isIn(['open', 'won', 'lost']),
  body('visibility').optional({ checkFalsy: true }).isIn(['public', 'restricted']),
];

function hasAdminRole(user) {
  return user.roles && user.roles.some(r =>
    ['admin', 'manager'].includes((r.name || r).toLowerCase()),
  );
}

const leadsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, stage, status, assigned_to, sort, order } = req.query;
      const isAdmin = hasAdminRole(req.user);
      let user_groups = [];
      if (!isAdmin) {
        user_groups = await require('../config/database').db('group_members')
          .where({ user_id: req.user.id })
          .pluck('group_id');
      }
      const result = await Lead.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        stage,
        status,
        assigned_to,
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
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      return success(res, lead);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const lead = await Lead.create(req.body, req.user.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'create_lead',
        entity_type: 'lead',
        entity_id: lead.id,
        new_values: lead,
        ip_address: req.ip,
      });
      return success(res, lead, 'Lead created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Lead.findById(req.params.id);
      if (!existing) return notFound(res, 'Lead not found.');
      const lead = await Lead.update(req.params.id, req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'update_lead',
        entity_type: 'lead',
        entity_id: req.params.id,
        old_values: existing,
        new_values: lead,
        ip_address: req.ip,
      });
      return success(res, lead, 'Lead updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Lead.findById(req.params.id);
      if (!existing) return notFound(res, 'Lead not found.');
      await Lead.softDelete(req.params.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'delete_lead',
        entity_type: 'lead',
        entity_id: req.params.id,
        ip_address: req.ip,
      });
      return success(res, null, 'Lead deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async moveStage(req, res, next) {
    try {
      const { stage } = req.body;
      if (!stage) return error(res, 'stage is required.', 400);
      const lead = await Lead.moveStage(req.params.id, stage);
      if (!lead) return notFound(res, 'Lead not found.');
      await AuditLog.create({
        user_id: req.user.id,
        action: 'move_lead_stage',
        entity_type: 'lead',
        entity_id: req.params.id,
        new_values: { stage },
        ip_address: req.ip,
      });
      return success(res, lead, 'Lead stage updated.');
    } catch (err) {
      return next(err);
    }
  },

  async getPipelineStats(req, res, next) {
    try {
      const stats = await Lead.getPipelineStats();
      return success(res, stats);
    } catch (err) {
      return next(err);
    }
  },

  async getConversionStats(req, res, next) {
    try {
      const stats = await Lead.getConversionStats();
      return success(res, stats);
    } catch (err) {
      return next(err);
    }
  },

  async getNotes(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      const Note = require('../models/Note');
      const notes = await Note.listByEntity('lead', req.params.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },

  async getGroups(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      const groups = await Lead.getGroups(req.params.id);
      return success(res, groups);
    } catch (err) {
      return next(err);
    }
  },

  async addGroup(req, res, next) {
    try {
      const { group_id } = req.body;
      if (!group_id) return error(res, 'group_id is required.', 400);
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      await Lead.addGroup(req.params.id, group_id);
      return success(res, null, 'Group added.');
    } catch (err) {
      return next(err);
    }
  },

  async removeGroup(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      await Lead.removeGroup(req.params.id, req.params.groupId);
      return success(res, null, 'Group removed.');
    } catch (err) {
      return next(err);
    }
  },

  async convertToProject(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (lead.status === 'won' || lead.status === 'lost') {
        return error(res, 'Cannot convert a lead that is already won or lost.', 400);
      }

      // Create project from lead data
      const projectData = {
        name: lead.title,
        description: lead.notes || '',
        status: 'planning',
        company_id: lead.company_id || null,
        source_lead_id: lead.id,
        budget: lead.value || null,
        visibility: lead.visibility || 'public',
      };
      const project = await Project.create(projectData, req.user.id);

      // If the lead had a contact, link it to the project
      if (lead.contact_id) {
        await Project.addContact(project.id, lead.contact_id).catch(() => {});
      }

      // Copy lead groups to project
      const leadGroups = await Lead.getGroups(lead.id);
      for (const g of leadGroups) {
        await Project.addGroup(project.id, g.id).catch(() => {});
      }

      // Mark lead as won
      await Lead.update(lead.id, { status: 'won' });

      await AuditLog.create({
        user_id: req.user.id,
        action: 'convert_lead_to_project',
        entity_type: 'lead',
        entity_id: lead.id,
        new_values: { project_id: project.id },
        ip_address: req.ip,
      });

      return success(res, { project_id: project.id }, 'Lead converted to project.', 201);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = leadsController;
