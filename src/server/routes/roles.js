'use strict';

const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', rolesController.list);
router.get('/permissions', requireRole('admin'), rolesController.listPermissions);
router.get('/:id', rolesController.getById);
router.post('/', requireRole('admin'), rolesController.createValidation, validate, rolesController.create);
router.put('/:id', requireRole('admin'), rolesController.update);
router.delete('/:id', requireRole('admin'), rolesController.delete);

router.get('/:id/permissions', requireRole('admin'), rolesController.getRolePermissions);
router.post('/:id/permissions', requireRole('admin'), rolesController.assignPermission);
router.delete('/:id/permissions/:permissionId', requireRole('admin'), rolesController.removePermission);

module.exports = router;
