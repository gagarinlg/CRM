'use strict';

const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', notesController.listByEntity);
router.get('/:id', notesController.getById);
router.post('/', notesController.createValidation, validate, notesController.create);
router.put('/:id', notesController.update);
router.delete('/:id', notesController.delete);

module.exports = router;
