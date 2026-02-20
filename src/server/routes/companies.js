'use strict';

const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', companiesController.list);
router.get('/:id', companiesController.getById);
router.post('/', companiesController.createValidation, validate, companiesController.create);
router.put('/:id', companiesController.update);
router.delete('/:id', companiesController.delete);

router.get('/:id/contacts', companiesController.getContacts);
router.get('/:id/projects', companiesController.getProjects);
router.get('/:id/notes', companiesController.getNotes);
router.get('/:id/leads', companiesController.getLeads);

module.exports = router;
