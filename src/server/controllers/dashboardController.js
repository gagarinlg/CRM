'use strict';

const Dashboard = require('../models/Dashboard');
const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

const dashboardController = {
  async getDashboard(req, res, next) {
    try {
      const data = await dashboardService.getDashboardData(req.user.id);
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async saveDashboard(req, res, next) {
    try {
      const config = await Dashboard.upsertForUser(req.user.id, req.body);
      return success(res, config, 'Dashboard configuration saved.');
    } catch (err) {
      return next(err);
    }
  },

  async getKPIs(req, res, next) {
    try {
      const kpis = await dashboardService.getKPIs();
      return success(res, kpis);
    } catch (err) {
      return next(err);
    }
  },

  async getRevenueData(req, res, next) {
    try {
      const { months = 6 } = req.query;
      const data = await dashboardService.getRevenueData({ months: parseInt(months, 10) });
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getLeadConversionData(req, res, next) {
    try {
      const data = await dashboardService.getLeadConversionData();
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getProjectStatusData(req, res, next) {
    try {
      const data = await dashboardService.getProjectStatusData();
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getActivityMetrics(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const data = await dashboardService.getActivityMetrics({ days: parseInt(days, 10) });
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getOverdueContacts(req, res, next) {
    try {
      const data = await dashboardService.getOverdueContactsWidget();
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getRecentActivity(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const data = await dashboardService.getRecentActivity(parseInt(limit, 10));
      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = dashboardController;
