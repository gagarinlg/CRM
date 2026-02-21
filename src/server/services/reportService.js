'use strict';

const { db } = require('../config/database');

const reportService = {
  async generateSalesReport({ from, to } = {}) {
    let query = db('leads').whereNull('deleted_at').where('status', 'won');
    if (from) query = query.where('updated_at', '>=', from);
    if (to) query = query.where('updated_at', '<=', to);

    const leads = await query
      .leftJoin('users as assigned', 'leads.assigned_to', 'assigned.id')
      .leftJoin('companies', 'leads.company_id', 'companies.id')
      .select(
        'leads.id', 'leads.title', 'leads.value', 'leads.stage', 'leads.updated_at as closed_at',
        'companies.name as company_name',
        db.raw("CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_to"),
      );

    const total_value = leads.reduce((sum, l) => sum + parseFloat(l.value || 0), 0);
    return { leads, summary: { count: leads.length, total_value } };
  },

  async generateLeadPipelineReport() {
    const pipeline = await db('leads')
      .whereNull('deleted_at')
      .where('status', 'open')
      .groupBy('stage')
      .select('stage')
      .count('* as count')
      .sum('value as total_value')
      .orderBy('stage');

    const total = await db('leads').whereNull('deleted_at').count('* as count').first();
    return { pipeline, total_leads: parseInt(total.count, 10) };
  },

  async generateProjectStatusReport() {
    const statuses = await db('projects')
      .whereNull('deleted_at')
      .groupBy('status')
      .select('status')
      .count('* as count');

    const projects = await db('projects')
      .whereNull('deleted_at')
      .leftJoin('companies', 'projects.company_id', 'companies.id')
      .select(
        'projects.id', 'projects.name', 'projects.status',
        'projects.start_date', 'projects.end_date', 'projects.budget',
        'companies.name as company_name',
      )
      .orderBy('projects.status')
      .orderBy('projects.name');

    return { statuses, projects };
  },

  async generateContactActivityReport({ from, to } = {}) {
    let query = db('contacts')
      .whereNull('deleted_at')
      .whereNotNull('last_contact_date');

    if (from) query = query.where('last_contact_date', '>=', from);
    if (to) query = query.where('last_contact_date', '<=', to);

    const contacts = await query
      .leftJoin('companies', 'contacts.company_id', 'companies.id')
      .select(
        'contacts.id', 'contacts.first_name', 'contacts.last_name',
        'contacts.email', 'contacts.last_contact_date',
        'companies.name as company_name',
      )
      .orderBy('contacts.last_contact_date', 'desc');

    const overdue = await db('contact_reminders')
      .where('is_completed', false)
      .where('remind_at', '<', db.raw('CURRENT_DATE'))
      .count('* as count')
      .first();

    return { contacts, overdue_reminders: parseInt(overdue.count, 10) };
  },

  async generateUserActivityReport({ from, to } = {}) {
    let query = db('audit_logs');
    if (from) query = query.where('created_at', '>=', from);
    if (to) query = query.where('created_at', '<=', to);

    const activity = await query
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .groupBy('audit_logs.user_id', 'users.first_name', 'users.last_name', 'users.email')
      .select(
        'audit_logs.user_id',
        'users.email',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as full_name"),
      )
      .count('audit_logs.id as action_count');

    return { activity };
  },

  async exportToCsv(data, columns) {
    const header = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(','),
    );
    return [header, ...rows].join('\n');
  },

  async exportToPdf() {
    // PDF generation requires an external library (e.g., pdfkit, puppeteer).
    // Return a structured object; controllers can render with their chosen library.
    throw Object.assign(new Error('PDF export requires a PDF library. Install pdfkit or puppeteer.'), { statusCode: 501 });
  },
};

module.exports = reportService;
