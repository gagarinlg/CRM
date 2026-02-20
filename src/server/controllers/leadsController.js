'use strict';

const { body } = require('express-validator');
const Lead = require('../models/Lead');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('title').notEmpty().withMessage('Lead title is required.'),
  body('value').optional().isFloat({ min: 0 }),
  body('probability').optional().isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['open', 'won', 'lost']),
];

const leadsController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, stage, status, assigned_to, sort, order } = req.query;
      const result = await Lead.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        stage,
        status,
        assigned_to,
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
};

module.exports = leadsController;
