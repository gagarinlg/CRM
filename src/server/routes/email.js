'use strict';

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.post('/send', requireRole('admin', 'manager'), emailController.sendValidation, validate, emailController.send);

router.get('/logs', requireRole('admin'), emailController.listLogs);
router.get('/logs/:id', requireRole('admin'), emailController.getLog);

router.get('/templates', emailController.listTemplates);
router.get('/templates/:id', emailController.getTemplate);
router.post('/templates', requireRole('admin'), emailController.templateValidation, validate, emailController.createTemplate);
router.put('/templates/:id', requireRole('admin'), emailController.updateTemplate);
router.delete('/templates/:id', requireRole('admin'), emailController.deleteTemplate);

module.exports = router;
