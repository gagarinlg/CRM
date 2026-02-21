'use strict';

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requireRole('admin', 'manager'), usersController.list);
router.get('/:id', requireRole('admin', 'manager'), usersController.getById);
router.post('/', requireRole('admin'), usersController.createValidation, validate, usersController.create);
router.put('/:id', requireRole('admin'), usersController.updateValidation, validate, usersController.update);
router.delete('/:id', requireRole('admin'), usersController.delete);

router.get('/:id/roles', requireRole('admin', 'manager'), usersController.getRoles);
router.post('/:id/roles', requireRole('admin'), usersController.assignRole);
router.delete('/:id/roles/:roleId', requireRole('admin'), usersController.removeRole);

module.exports = router;
