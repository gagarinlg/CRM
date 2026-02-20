'use strict';

const { body } = require('express-validator');
const { db } = require('../config/database');
const emailService = require('../services/emailService');
const EmailLog = require('../models/EmailLog');
const { success, error, paginated, notFound } = require('../utils/response');

const sendValidation = [
  body('to').isEmail().withMessage('Valid recipient email is required.'),
  body('subject').notEmpty().withMessage('Subject is required.'),
  body('html').notEmpty().withMessage('Email HTML body is required.'),
];

const templateValidation = [
  body('name').notEmpty().withMessage('Template name is required.'),
  body('subject').notEmpty().withMessage('Subject is required.'),
];

const emailController = {
  sendValidation,
  templateValidation,

  // ── Send Email ─────────────────────────────────────────────────────────────

  async send(req, res, next) {
    try {
      await emailService.sendEmail(req.body);
      return success(res, null, 'Email sent successfully.');
    } catch (err) {
      return next(err);
    }
  },

  // ── Email Logs ─────────────────────────────────────────────────────────────

  async listLogs(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await EmailLog.list({ page: parseInt(page, 10), limit: parseInt(limit, 10), status });
      return paginated(res, result.data, result.total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      return next(err);
    }
  },

  async getLog(req, res, next) {
    try {
      const log = await EmailLog.getById(req.params.id);
      if (!log) return notFound(res, 'Email log not found.');
      return success(res, log);
    } catch (err) {
      return next(err);
    }
  },

  // ── Email Templates ────────────────────────────────────────────────────────

  async listTemplates(req, res, next) {
    try {
      const templates = await db('email_templates').select('id', 'name', 'subject', 'variables', 'created_at').orderBy('name');
      return success(res, templates);
    } catch (err) {
      return next(err);
    }
  },

  async getTemplate(req, res, next) {
    try {
      const template = await db('email_templates').where({ id: req.params.id }).first();
      if (!template) return notFound(res, 'Template not found.');
      return success(res, template);
    } catch (err) {
      return next(err);
    }
  },

  async createTemplate(req, res, next) {
    try {
      const { name, subject, html_body, text_body, variables } = req.body;
      const [template] = await db('email_templates')
        .insert({ name, subject, html_body, text_body, variables: JSON.stringify(variables || []) })
        .returning('*');
      return success(res, template, 'Template created.', 201);
    } catch (err) {
      return next(err);
    }
  },

  async updateTemplate(req, res, next) {
    try {
      const existing = await db('email_templates').where({ id: req.params.id }).first();
      if (!existing) return notFound(res, 'Template not found.');

      const { name, subject, html_body, text_body, variables } = req.body;
      const data = {};
      if (name !== undefined) data.name = name;
      if (subject !== undefined) data.subject = subject;
      if (html_body !== undefined) data.html_body = html_body;
      if (text_body !== undefined) data.text_body = text_body;
      if (variables !== undefined) data.variables = JSON.stringify(variables);
      data.updated_at = db.fn.now();

      const [template] = await db('email_templates').where({ id: req.params.id }).update(data).returning('*');
      return success(res, template, 'Template updated.');
    } catch (err) {
      return next(err);
    }
  },

  async deleteTemplate(req, res, next) {
    try {
      const existing = await db('email_templates').where({ id: req.params.id }).first();
      if (!existing) return notFound(res, 'Template not found.');
      await db('email_templates').where({ id: req.params.id }).delete();
      return success(res, null, 'Template deleted.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = emailController;
