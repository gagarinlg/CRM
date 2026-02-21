'use strict';

const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requirePermission('notes.read'), notesController.listByEntity);
router.get('/:id', requirePermission('notes.read'), notesController.getById);
router.post('/', requirePermission('notes.write'), notesController.createValidation, validate, notesController.create);
router.put('/:id', requirePermission('notes.write'), notesController.update);
router.delete('/:id', requirePermission('notes.delete'), notesController.delete);

module.exports = router;
