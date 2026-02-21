'use strict';

const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/export', requirePermission('projects.read'), projectsController.exportCsv);
router.post('/bulk-delete', requirePermission('projects.delete'), projectsController.bulkDelete);

router.get('/', requirePermission('projects.read'), projectsController.list);
router.get('/:id', requirePermission('projects.read'), projectsController.getById);
router.post('/', requirePermission('projects.write'), projectsController.createValidation, validate, projectsController.create);
router.put('/:id', requirePermission('projects.write'), projectsController.update);
router.delete('/:id', requirePermission('projects.delete'), projectsController.delete);

router.get('/:id/contacts', requirePermission('projects.read'), projectsController.getContacts);
router.post('/:id/contacts', requirePermission('projects.write'), projectsController.addContact);
router.delete('/:id/contacts/:contactId', requirePermission('projects.write'), projectsController.removeContact);

router.get('/:id/members', requirePermission('projects.read'), projectsController.getMembers);
router.post('/:id/members', requirePermission('projects.write'), projectsController.addMember);
router.delete('/:id/members/:userId', requirePermission('projects.write'), projectsController.removeMember);

router.get('/:id/notes', requirePermission('projects.read'), projectsController.getNotes);

router.get('/:id/groups', requirePermission('projects.read'), projectsController.getGroups);
router.post('/:id/groups', requirePermission('projects.write'), projectsController.addGroup);
router.delete('/:id/groups/:groupId', requirePermission('projects.write'), projectsController.removeGroup);

router.get('/:id/activity', requirePermission('projects.read'), projectsController.getActivity);

module.exports = router;
