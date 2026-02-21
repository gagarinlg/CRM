'use strict';

const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/export', requirePermission('leads.read'), leadsController.exportCsv);
router.post('/bulk-delete', requirePermission('leads.delete'), leadsController.bulkDelete);

router.get('/', requirePermission('leads.read'), leadsController.list);
router.get('/stats/pipeline', requirePermission('leads.read'), leadsController.getPipelineStats);
router.get('/stats/conversion', requirePermission('leads.read'), leadsController.getConversionStats);
router.get('/:id', requirePermission('leads.read'), leadsController.getById);
router.post('/', requirePermission('leads.write'), leadsController.createValidation, validate, leadsController.create);
router.put('/:id', requirePermission('leads.write'), leadsController.update);
router.delete('/:id', requirePermission('leads.delete'), leadsController.delete);
router.patch('/:id/stage', requirePermission('leads.write'), leadsController.moveStage);
router.get('/:id/notes', requirePermission('leads.read'), leadsController.getNotes);
router.get('/:id/contacts', requirePermission('leads.read'), leadsController.getContacts);
router.post('/:id/contacts', requirePermission('leads.write'), leadsController.addContact);
router.delete('/:id/contacts/:contactId', requirePermission('leads.write'), leadsController.removeContact);
router.get('/:id/members', requirePermission('leads.read'), leadsController.getMembers);
router.post('/:id/members', requirePermission('leads.write'), leadsController.addMember);
router.delete('/:id/members/:userId', requirePermission('leads.write'), leadsController.removeMember);
router.get('/:id/groups', requirePermission('leads.read'), leadsController.getGroups);
router.post('/:id/groups', requirePermission('leads.write'), leadsController.addGroup);
router.delete('/:id/groups/:groupId', requirePermission('leads.write'), leadsController.removeGroup);
router.get('/:id/activity', requirePermission('leads.read'), leadsController.getActivity);
router.post('/:id/convert', requirePermission('leads.write'), leadsController.convertToProject);

module.exports = router;
