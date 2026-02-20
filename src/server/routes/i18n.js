'use strict';

const express = require('express');
const router = express.Router();
const i18nController = require('../controllers/i18nController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes
router.get('/languages', i18nController.getLanguages);
router.get('/:lang', i18nController.getByLanguage);

// Admin routes
router.use(verifyToken);
router.get('/', requireRole('admin'), i18nController.listKeys);
router.get('/admin/languages', requireRole('admin'), i18nController.getAllLanguages);
router.get('/admin/modules', requireRole('admin'), i18nController.getModules);
router.post('/', requireRole('admin'), i18nController.createValidation, validate, i18nController.create);
router.put('/upsert', requireRole('admin'), i18nController.upsert);
router.put('/:id', requireRole('admin'), i18nController.update);
router.delete('/:id', requireRole('admin'), i18nController.delete);

module.exports = router;
