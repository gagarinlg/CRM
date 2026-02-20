'use strict';

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin', 'manager'));

router.get('/sales', reportsController.salesReport);
router.get('/lead-pipeline', reportsController.leadPipelineReport);
router.get('/project-status', reportsController.projectStatusReport);
router.get('/contact-activity', reportsController.contactActivityReport);
router.get('/user-activity', requireRole('admin'), reportsController.userActivityReport);

module.exports = router;
