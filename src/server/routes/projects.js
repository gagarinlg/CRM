'use strict';

const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', projectsController.list);
router.get('/:id', projectsController.getById);
router.post('/', projectsController.createValidation, validate, projectsController.create);
router.put('/:id', projectsController.update);
router.delete('/:id', projectsController.delete);

router.post('/:id/contacts', projectsController.addContact);
router.delete('/:id/contacts/:contactId', projectsController.removeContact);

router.post('/:id/members', projectsController.addMember);
router.delete('/:id/members/:userId', projectsController.removeMember);

router.get('/:id/notes', projectsController.getNotes);

router.get('/:id/groups', projectsController.getGroups);
router.post('/:id/groups', projectsController.addGroup);
router.delete('/:id/groups/:groupId', projectsController.removeGroup);

module.exports = router;
