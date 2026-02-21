'use strict';

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', requirePermission('calendar.read'), calendarController.list);
router.get('/recurring', requirePermission('calendar.read'), calendarController.getRecurring);
router.get('/by-entity', requirePermission('calendar.read'), calendarController.listByEntity);
router.get('/:id', requirePermission('calendar.read'), calendarController.getById);
router.post('/', requirePermission('calendar.write'), calendarController.createValidation, validate, calendarController.create);
router.put('/:id', requirePermission('calendar.write'), calendarController.update);
router.delete('/:id', requirePermission('calendar.delete'), calendarController.delete);

module.exports = router;
