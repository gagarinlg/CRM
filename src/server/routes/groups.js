'use strict';

const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requireRole('admin', 'manager'), groupsController.list);
router.get('/:id', requireRole('admin', 'manager'), groupsController.getById);
router.post('/', requireRole('admin'), groupsController.createValidation, validate, groupsController.create);
router.put('/:id', requireRole('admin'), groupsController.update);
router.delete('/:id', requireRole('admin'), groupsController.delete);

router.get('/:id/members', requireRole('admin', 'manager'), groupsController.getMembers);
router.post('/:id/members', requireRole('admin'), groupsController.addMember);
router.delete('/:id/members/:userId', requireRole('admin'), groupsController.removeMember);

router.post('/:id/roles', requireRole('admin'), groupsController.assignRole);
router.delete('/:id/roles/:roleId', requireRole('admin'), groupsController.removeRole);

module.exports = router;
