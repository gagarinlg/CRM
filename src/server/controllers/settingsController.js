'use strict';

const { body } = require('express-validator');
const { db } = require('../config/database');
const emailService = require('../services/emailService');
const reminderService = require('../services/reminderService');
const { success } = require('../utils/response');

const smtpValidation = [
  body('host').notEmpty().withMessage('SMTP host is required.'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port is required.'),
  body('from_address').isEmail().withMessage('Valid from_address is required.'),
];

const settingsController = {
  smtpValidation,

  // ── SMTP Settings ─────────────────────────────────────────────────────────

  async getSmtpSettings(req, res, next) {
    try {
      const settings = await emailService.getSmtpSettings();
      if (settings) {
        // Mask password
        settings.password_encrypted = settings.password_encrypted ? '***' : null;
      }
      return success(res, settings || null);
    } catch (err) {
      return next(err);
    }
  },

  async saveSmtpSettings(req, res, next) {
    try {
      const existing = await db('smtp_settings').first();
      const data = {
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        from_address: req.body.from_address,
        from_name: req.body.from_name,
        is_active: req.body.is_active !== false,
      };
      if (req.body.password) {
        data.password_encrypted = req.body.password;
      }

      let settings;
      if (existing) {
        [settings] = await db('smtp_settings').where({ id: existing.id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
      } else {
        [settings] = await db('smtp_settings').insert(data).returning('*');
      }
      settings.password_encrypted = settings.password_encrypted ? '***' : null;
      return success(res, settings, 'SMTP settings saved.');
    } catch (err) {
      return next(err);
    }
  },

  async testSmtpSettings(req, res, next) {
    try {
      const { test_email } = req.body;
      await emailService.sendEmail({
        to: test_email || req.user.email,
        subject: 'CRM SMTP Test',
        html: '<p>This is a test email from your CRM system.</p>',
      });
      return success(res, null, 'Test email sent successfully.');
    } catch (err) {
      return next(err);
    }
  },

  // ── Reminder Settings ──────────────────────────────────────────────────────

  async getReminderSettings(req, res, next) {
    try {
      const settings = await reminderService.getSettings(req.user.id);
      return success(res, settings || null);
    } catch (err) {
      return next(err);
    }
  },

  async saveReminderSettings(req, res, next) {
    try {
      const settings = await reminderService.updateSettings(req.user.id, req.body);
      return success(res, settings, 'Reminder settings saved.');
    } catch (err) {
      return next(err);
    }
  },

  // ── System Info ────────────────────────────────────────────────────────────

  async getSystemInfo(req, res, next) {
    try {
      const info = {
        node_version: process.version,
        app_version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
      return success(res, info);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = settingsController;
