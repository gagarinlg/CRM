'use strict';

const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requirePermission('companies.read'), companiesController.list);
router.get('/:id', requirePermission('companies.read'), companiesController.getById);
router.post('/', requirePermission('companies.write'), companiesController.createValidation, validate, companiesController.create);
router.put('/:id', requirePermission('companies.write'), companiesController.update);
router.delete('/:id', requirePermission('companies.delete'), companiesController.delete);

router.get('/:id/contacts', requirePermission('companies.read'), companiesController.getContacts);
router.get('/:id/projects', requirePermission('companies.read'), companiesController.getProjects);
router.get('/:id/notes', requirePermission('companies.read'), companiesController.getNotes);
router.get('/:id/leads', requirePermission('companies.read'), companiesController.getLeads);

module.exports = router;
