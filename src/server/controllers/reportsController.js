'use strict';

const reportService = require('../services/reportService');
const { success, error } = require('../utils/response');

const reportsController = {
  async salesReport(req, res, next) {
    try {
      const { from, to, format = 'json' } = req.query;
      const data = await reportService.generateSalesReport({ from, to });

      if (format === 'csv') {
        const columns = ['id', 'title', 'value', 'stage', 'closed_at', 'company_name', 'assigned_to'];
        const csv = await reportService.exportToCsv(data.leads, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
        return res.send(csv);
      }

      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async leadPipelineReport(req, res, next) {
    try {
      const { format = 'json' } = req.query;
      const data = await reportService.generateLeadPipelineReport();

      if (format === 'csv') {
        const csv = await reportService.exportToCsv(data.pipeline, ['stage', 'count', 'total_value']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="lead-pipeline.csv"');
        return res.send(csv);
      }

      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async projectStatusReport(req, res, next) {
    try {
      const { format = 'json' } = req.query;
      const data = await reportService.generateProjectStatusReport();

      if (format === 'csv') {
        const columns = ['id', 'name', 'status', 'start_date', 'end_date', 'budget', 'company_name'];
        const csv = await reportService.exportToCsv(data.projects, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="project-status.csv"');
        return res.send(csv);
      }

      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async contactActivityReport(req, res, next) {
    try {
      const { from, to, format = 'json' } = req.query;
      const data = await reportService.generateContactActivityReport({ from, to });

      if (format === 'csv') {
        const columns = ['id', 'first_name', 'last_name', 'email', 'last_contact_date', 'company_name'];
        const csv = await reportService.exportToCsv(data.contacts, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="contact-activity.csv"');
        return res.send(csv);
      }

      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async userActivityReport(req, res, next) {
    try {
      const { from, to, format = 'json' } = req.query;
      const data = await reportService.generateUserActivityReport({ from, to });

      if (format === 'csv') {
        const csv = await reportService.exportToCsv(data.activity, ['user_id', 'email', 'full_name', 'action_count']);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user-activity.csv"');
        return res.send(csv);
      }

      return success(res, data);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = reportsController;
