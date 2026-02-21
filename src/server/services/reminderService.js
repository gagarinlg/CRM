'use strict';

const { db } = require('../config/database');
const emailService = require('./emailService');
const logger = require('../config/logger');

const reminderService = {
  /**
   * Fetch all overdue/due-today contact reminders.
   */
  async getOverdueContacts() {
    return db('contact_reminders')
      .join('contacts', 'contact_reminders.contact_id', 'contacts.id')
      .join('users', 'contact_reminders.user_id', 'users.id')
      .where('contact_reminders.remind_at', '<=', db.raw('CURRENT_DATE'))
      .where('contact_reminders.is_completed', false)
      .whereNull('contacts.deleted_at')
      .select(
        'contact_reminders.*',
        'contacts.first_name', 'contacts.last_name', 'contacts.email as contact_email',
        'users.email as user_email', 'users.first_name as user_first_name',
      );
  },

  /**
   * Check and send email reminders for overdue contact follow-ups.
   */
  async checkContactReminders() {
    const reminders = await this.getOverdueContacts();
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        await emailService.sendReminderEmail(
          reminder.user_email,
          { first_name: reminder.first_name, last_name: reminder.last_name },
          reminder.note,
        );
        sent++;
        logger.info(`Reminder sent for contact ${reminder.contact_id} to ${reminder.user_email}`);
      } catch (err) {
        failed++;
        logger.error(`Failed to send reminder for contact ${reminder.contact_id}:`, { error: err.message });
      }
    }

    return { sent, failed, total: reminders.length };
  },

  /**
   * Send reminders for a specific user.
   */
  async sendReminders(userId) {
    const reminders = await db('contact_reminders')
      .join('contacts', 'contact_reminders.contact_id', 'contacts.id')
      .join('users', 'contact_reminders.user_id', 'users.id')
      .where('contact_reminders.user_id', userId)
      .where('contact_reminders.remind_at', '<=', db.raw('CURRENT_DATE'))
      .where('contact_reminders.is_completed', false)
      .whereNull('contacts.deleted_at')
      .select(
        'contact_reminders.*',
        'contacts.first_name', 'contacts.last_name',
        'users.email as user_email',
      );

    for (const r of reminders) {
      await emailService.sendReminderEmail(r.user_email, { first_name: r.first_name, last_name: r.last_name }, r.note);
    }
    return reminders.length;
  },

  /**
   * Get reminder settings for a user.
   */
  async getSettings(userId) {
    return db('reminder_settings').where({ user_id: userId }).first();
  },

  /**
   * Create or update reminder settings for a user.
   */
  async updateSettings(userId, settings) {
    const existing = await this.getSettings(userId);
    const allowed = ['email_notifications', 'reminder_days_before', 'daily_digest', 'digest_time'];
    const data = Object.fromEntries(Object.entries(settings).filter(([k]) => allowed.includes(k)));

    if (existing) {
      const [updated] = await db('reminder_settings')
        .where({ user_id: userId })
        .update({ ...data, updated_at: db.fn.now() })
        .returning('*');
      return updated;
    }

    const [created] = await db('reminder_settings')
      .insert({ user_id: userId, ...data })
      .returning('*');
    return created;
  },
};

module.exports = reminderService;
