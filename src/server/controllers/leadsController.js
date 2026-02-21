'use strict';

const { body } = require('express-validator');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const Attachment = require('../models/Attachment');
const Note = require('../models/Note');
const { success, error, paginated, notFound, forbidden } = require('../utils/response');
const { db } = require('../config/database');

const MAX_EXPORT_ROWS = 10000;

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

async function checkLeadAccess(user, lead) {
  if (lead.visibility !== 'restricted') return true;
  if (hasAdminRole(user)) return true;
  if (lead.created_by === user.id) return true;
  if (lead.assigned_to === user.id) return true;
  const userGroups = await db('group_members').where({ user_id: user.id }).pluck('group_id');
  if (userGroups.length > 0) {
    const matched = await db('lead_groups')
      .where('lead_id', lead.id)
      .whereIn('group_id', userGroups)
      .first();
    if (matched) return true;
  }
  const isMember = await db('lead_members')
    .where({ lead_id: lead.id, user_id: user.id })
    .first();
  return !!isMember;
}

const leadsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, stage, status, assigned_to, sort, order } = req.query;
      const isAdmin = hasAdminRole(req.user);
      let user_groups = [];
      if (!isAdmin) {
        user_groups = await db('group_members')
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
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');

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
      if (!(await checkLeadAccess(req.user, existing))) return forbidden(res, 'Access denied.');
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
      if (!(await checkLeadAccess(req.user, existing))) return forbidden(res, 'Access denied.');
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
      const existing = await Lead.findById(req.params.id);
      if (!existing) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, existing))) return forbidden(res, 'Access denied.');
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
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
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
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
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
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
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
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      await Lead.removeGroup(req.params.id, req.params.groupId);
      return success(res, null, 'Group removed.');
    } catch (err) {
      return next(err);
    }
  },

  async getContacts(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      const contacts = await Lead.getContacts(req.params.id);
      return success(res, contacts);
    } catch (err) {
      return next(err);
    }
  },

  async addContact(req, res, next) {
    try {
      const { contact_id } = req.body;
      if (!contact_id) return error(res, 'contact_id is required.', 400);
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      await Lead.addContact(req.params.id, contact_id);
      return success(res, null, 'Contact added.');
    } catch (err) {
      return next(err);
    }
  },

  async removeContact(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      await Lead.removeContact(req.params.id, req.params.contactId);
      return success(res, null, 'Contact removed.');
    } catch (err) {
      return next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      const members = await Lead.getMembers(req.params.id);
      return success(res, members);
    } catch (err) {
      return next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const { user_id, role } = req.body;
      if (!user_id) return error(res, 'user_id is required.', 400);
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      await Lead.addMember(req.params.id, user_id, role);
      return success(res, null, 'Member added.');
    } catch (err) {
      return next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      await Lead.removeMember(req.params.id, req.params.userId);
      return success(res, null, 'Member removed.');
    } catch (err) {
      return next(err);
    }
  },

  async getActivity(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
      const { page = 1, limit = 20 } = req.query;
      const result = await AuditLog.list({
        entity_type: 'lead',
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
      await db('leads').whereIn('id', ids).update({ deleted_at: db.fn.now() });
      await AuditLog.create({
        user_id: req.user.id,
        action: 'bulk_delete_leads',
        entity_type: 'lead',
        new_values: { ids },
        ip_address: req.ip,
      });
      return success(res, null, `${ids.length} lead(s) deleted.`);
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
      const result = await Lead.list({
        page: 1,
        limit: MAX_EXPORT_ROWS,
        user_id: isAdmin ? null : req.user.id,
        user_groups,
      });
      const rows = result.data;
      const headers = ['id', 'title', 'value', 'probability', 'stage', 'status', 'visibility', 'source', 'company_name', 'contact_name', 'assigned_to_name', 'created_at'];
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      return res.send(csv);
    } catch (err) {
      return next(err);
    }
  },

  async convertToProject(req, res, next) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return notFound(res, 'Lead not found.');
      if (!(await checkLeadAccess(req.user, lead))) return forbidden(res, 'Access denied.');
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

      // Copy lead contacts (junction table) to project
      const leadContacts = await Lead.getContacts(lead.id);
      for (const c of leadContacts) {
        await Project.addContact(project.id, c.id).catch(() => {});
      }
      // Also copy single contact_id FK if not already in junction table
      if (lead.contact_id && !leadContacts.find(c => c.id === lead.contact_id)) {
        await Project.addContact(project.id, lead.contact_id).catch(() => {});
      }

      // Copy lead members to project
      const leadMembers = await Lead.getMembers(lead.id);
      for (const m of leadMembers) {
        await Project.addMember(project.id, m.id, m.role).catch(() => {});
      }

      // Copy assigned_to as project member if not already added
      if (lead.assigned_to && !leadMembers.find(m => String(m.id) === String(lead.assigned_to))) {
        await Project.addMember(project.id, lead.assigned_to, 'member').catch(() => {});
      }

      // Copy lead groups to project
      const leadGroups = await Lead.getGroups(lead.id);
      for (const g of leadGroups) {
        await Project.addGroup(project.id, g.id).catch(() => {});
      }

      // Copy lead file attachments to project (same file on disk, new DB row)
      const leadFiles = await Attachment.listByEntity('lead', lead.id);
      for (const f of leadFiles) {
        await Attachment.create({
          entity_type: 'project',
          entity_id: project.id,
          filename: f.filename,
          original_name: f.original_name,
          mime_type: f.mime_type,
          size: f.size,
          uploaded_by: f.uploaded_by,
        }).catch(() => {});
      }

      // Copy lead notes to project
      const leadNotes = await Note.listByEntity('lead', lead.id);
      for (const n of leadNotes) {
        await db('notes').insert({
          entity_type: 'project',
          entity_id: project.id,
          content: n.content,
          type: n.type || 'general',
          created_by: n.created_by,
        }).catch(() => {});
      }

      // Create an informational note with the lead's pipeline details
      const leadInfo = [
        lead.stage ? `Stage: ${lead.stage}` : null,
        lead.source ? `Source: ${lead.source}` : null,
        lead.probability != null ? `Probability: ${lead.probability}%` : null,
        lead.value != null ? `Lead value: ${lead.value}` : null,
      ].filter(Boolean).join('\n');
      if (leadInfo) {
        await db('notes').insert({
          entity_type: 'project',
          entity_id: project.id,
          content: `Converted from lead. Lead details:\n${leadInfo}`,
          type: 'general',
          created_by: req.user.id,
        }).catch(() => {});
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
