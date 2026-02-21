'use strict';

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', calendarController.list);
router.get('/recurring', calendarController.getRecurring);
router.get('/by-entity', calendarController.listByEntity);
router.get('/:id', calendarController.getById);
router.post('/', calendarController.createValidation, validate, calendarController.create);
router.put('/:id', calendarController.update);
router.delete('/:id', calendarController.delete);

module.exports = router;
