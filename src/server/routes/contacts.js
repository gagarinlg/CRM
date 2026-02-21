'use strict';

const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', contactsController.list);
router.get('/:id', contactsController.getById);
router.post('/', contactsController.createValidation, validate, contactsController.create);
router.put('/:id', contactsController.update);
router.delete('/:id', contactsController.delete);

router.patch('/:id/last-contact', contactsController.updateLastContact);
router.get('/:id/notes', contactsController.getNotes);
router.get('/:id/projects', contactsController.getProjects);

module.exports = router;
