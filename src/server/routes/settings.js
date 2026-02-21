'use strict';

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

// SMTP settings (admin only)
router.get('/smtp', requireRole('admin'), settingsController.getSmtpSettings);
router.post('/smtp', requireRole('admin'), settingsController.smtpValidation, validate, settingsController.saveSmtpSettings);
router.post('/smtp/test', requireRole('admin'), settingsController.testSmtpSettings);

// Per-user reminder settings
router.get('/reminders', settingsController.getReminderSettings);
router.post('/reminders', settingsController.saveReminderSettings);

// System info (admin only)
router.get('/system', requireRole('admin'), settingsController.getSystemInfo);

// Demo data (admin only)
router.post('/demo-data', requireRole('admin'), settingsController.loadDemoData);

// Calendar settings
router.get('/calendar', settingsController.getCalendarSettings);
router.post('/calendar', requireRole('admin'), settingsController.saveCalendarSettings);

module.exports = router;
