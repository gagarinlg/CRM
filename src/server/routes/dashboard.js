'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', dashboardController.getDashboard);
router.post('/', dashboardController.saveDashboard);
router.get('/widgets/kpis', dashboardController.getKPIs);
router.get('/widgets/revenue', dashboardController.getRevenueData);
router.get('/widgets/lead-conversion', dashboardController.getLeadConversionData);
router.get('/widgets/project-status', dashboardController.getProjectStatusData);
router.get('/widgets/activity', dashboardController.getActivityMetrics);
router.get('/widgets/overdue-contacts', dashboardController.getOverdueContacts);
router.get('/widgets/recent-activity', dashboardController.getRecentActivity);

module.exports = router;
