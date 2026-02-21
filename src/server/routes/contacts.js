'use strict';

const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requirePermission('contacts.read'), contactsController.list);
router.get('/:id', requirePermission('contacts.read'), contactsController.getById);
router.post('/', requirePermission('contacts.write'), contactsController.createValidation, validate, contactsController.create);
router.put('/:id', requirePermission('contacts.write'), contactsController.update);
router.delete('/:id', requirePermission('contacts.delete'), contactsController.delete);

router.patch('/:id/last-contact', requirePermission('contacts.write'), contactsController.updateLastContact);
router.get('/:id/notes', requirePermission('contacts.read'), contactsController.getNotes);
router.get('/:id/projects', requirePermission('contacts.read'), contactsController.getProjects);

module.exports = router;
