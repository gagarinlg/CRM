'use strict';

const { body } = require('express-validator');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const { success, paginated, notFound } = require('../utils/response');

const createValidation = [
  body('name').notEmpty().withMessage('Company name is required.'),
  body('email').optional().isEmail().normalizeEmail(),
  body('website').optional().isURL(),
];

const companiesController = {
  createValidation,

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, industry, size, sort, order } = req.query;
      const result = await Company.list({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        industry,
        size,
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
      const company = await Company.findById(req.params.id);
      if (!company) return notFound(res, 'Company not found.');
      return success(res, company);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const company = await Company.create(req.body, req.user.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'create_company',
        entity_type: 'company',
        entity_id: company.id,
        new_values: company,
        ip_address: req.ip,
      });
      return success(res, company, 'Company created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await Company.findById(req.params.id);
      if (!existing) return notFound(res, 'Company not found.');
      const company = await Company.update(req.params.id, req.body);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'update_company',
        entity_type: 'company',
        entity_id: req.params.id,
        old_values: existing,
        new_values: company,
        ip_address: req.ip,
      });
      return success(res, company, 'Company updated.');
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Company.findById(req.params.id);
      if (!existing) return notFound(res, 'Company not found.');
      await Company.softDelete(req.params.id);
      await AuditLog.create({
        user_id: req.user.id,
        action: 'delete_company',
        entity_type: 'company',
        entity_id: req.params.id,
        ip_address: req.ip,
      });
      return success(res, null, 'Company deleted.');
    } catch (err) {
      return next(err);
    }
  },

  async getContacts(req, res, next) {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return notFound(res, 'Company not found.');
      const contacts = await Company.getContacts(req.params.id);
      return success(res, contacts);
    } catch (err) {
      return next(err);
    }
  },

  async getProjects(req, res, next) {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return notFound(res, 'Company not found.');
      const projects = await Company.getProjects(req.params.id);
      return success(res, projects);
    } catch (err) {
      return next(err);
    }
  },

  async getNotes(req, res, next) {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return notFound(res, 'Company not found.');
      const notes = await Company.getNotes(req.params.id);
      return success(res, notes);
    } catch (err) {
      return next(err);
    }
  },

  async getLeads(req, res, next) {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return notFound(res, 'Company not found.');
      const leads = await Company.getLeads(req.params.id);
      return success(res, leads);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = companiesController;
