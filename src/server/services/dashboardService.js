'use strict';

const { db } = require('../config/database');
const Dashboard = require('../models/Dashboard');

const dashboardService = {
  async getDashboardData(userId) {
    const [config, kpis, recentActivity] = await Promise.all([
      Dashboard.getByUser(userId),
      this.getKPIs(),
      this.getRecentActivity(),
    ]);
    return { config, kpis, recent_activity: recentActivity };
  },

  async getKPIs() {
    const [companies, contacts, projects, leads] = await Promise.all([
      db('companies').whereNull('deleted_at').count('* as count').first(),
      db('contacts').whereNull('deleted_at').count('* as count').first(),
      db('projects').whereNull('deleted_at').where('status', 'active').count('* as count').first(),
      db('leads').whereNull('deleted_at').where('status', 'open').count('* as count').first(),
    ]);

    const wonValue = await db('leads')
      .whereNull('deleted_at')
      .where('status', 'won')
      .sum('value as total')
      .first();

    return {
      total_companies: parseInt(companies.count, 10),
      total_contacts: parseInt(contacts.count, 10),
      active_projects: parseInt(projects.count, 10),
      open_leads: parseInt(leads.count, 10),
      total_won_value: parseFloat(wonValue.total || 0),
    };
  },

  async getRevenueData({ months = 6 } = {}) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return db('leads')
      .whereNull('deleted_at')
      .where('status', 'won')
      .where('updated_at', '>=', cutoff.toISOString())
      .groupByRaw("DATE_TRUNC('month', updated_at)")
      .select(db.raw("DATE_TRUNC('month', updated_at) as month"))
      .sum('value as revenue')
      .orderBy('month');
  },

  async getLeadConversionData() {
    const pipeline = await db('leads')
      .whereNull('deleted_at')
      .groupBy('stage')
      .select('stage')
      .count('* as count')
      .orderBy('stage');

    const won = await db('leads').whereNull('deleted_at').where('status', 'won').count('* as count').first();
    const total = await db('leads').whereNull('deleted_at').count('* as count').first();

    return {
      pipeline,
      conversion_rate: total.count > 0 ? ((won.count / total.count) * 100).toFixed(2) : 0,
    };
  },

  async getProjectStatusData() {
    return db('projects')
      .whereNull('deleted_at')
      .groupBy('status')
      .select('status')
      .count('* as count');
  },

  async getActivityMetrics({ days = 30 } = {}) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return db('audit_logs')
      .where('created_at', '>=', cutoff.toISOString())
      .groupBy('action')
      .select('action')
      .count('* as count')
      .orderBy('count', 'desc');
  },

  async getOverdueContactsWidget() {
    return db('contact_reminders')
      .join('contacts', 'contact_reminders.contact_id', 'contacts.id')
      .where('contact_reminders.remind_at', '<=', db.raw('CURRENT_DATE'))
      .where('contact_reminders.is_completed', false)
      .whereNull('contacts.deleted_at')
      .select(
        'contact_reminders.id', 'contact_reminders.remind_at', 'contact_reminders.note',
        'contacts.first_name', 'contacts.last_name', 'contacts.email',
      )
      .limit(10)
      .orderBy('contact_reminders.remind_at');
  },

  async getRecentActivity(limit = 20) {
    return db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.id', 'audit_logs.action', 'audit_logs.entity_type',
        'audit_logs.entity_id', 'audit_logs.created_at',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as user_name"),
        'users.email as user_email',
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit);
  },
};

module.exports = dashboardService;
