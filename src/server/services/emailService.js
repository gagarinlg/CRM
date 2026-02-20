'use strict';

const nodemailer = require('nodemailer');
const { db } = require('../config/database');
const EmailLog = require('../models/EmailLog');
const logger = require('../config/logger');

let _transporter = null;

async function getSmtpSettings() {
  return db('smtp_settings').where({ is_active: true }).first();
}

async function getTransporter() {
  const settings = await getSmtpSettings();

  if (settings) {
    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      // NOTE: password_encrypted stores the SMTP password. If your deployment
      // encrypts it at rest, decrypt it here before passing to nodemailer.
      auth: { user: settings.username, pass: settings.password_encrypted },
    });
  }

  // Fall back to environment variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function getFromAddress(settings) {
  if (settings && settings.from_address) {
    return settings.from_name
      ? `"${settings.from_name}" <${settings.from_address}>`
      : settings.from_address;
  }
  return process.env.SMTP_FROM || process.env.SMTP_USER;
}

async function loadTemplate(name) {
  return db('email_templates').where({ name }).first();
}

function renderTemplate(template, variables) {
  let { subject, html_body, text_body } = template;
  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    subject = subject ? subject.replace(re, value) : subject;
    html_body = html_body ? html_body.replace(re, value) : html_body;
    text_body = text_body ? text_body.replace(re, value) : text_body;
  }
  return { subject, html_body, text_body };
}

const emailService = {
  async sendEmail({ to, subject, html, text, logId } = {}) {
    let log;
    try {
      log = await EmailLog.create({ to_address: to, subject, html_body: html, status: 'pending' });

      const settings = await getSmtpSettings();
      const transporter = await getTransporter();

      const info = await transporter.sendMail({
        from: getFromAddress(settings),
        to,
        subject,
        html,
        ...(text && { text }),
      });

      await EmailLog.updateStatus(log.id, 'sent');
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      if (log) await EmailLog.updateStatus(log.id, 'failed', err.message);
      logger.error(`Failed to send email to ${to}:`, { error: err.message });
      throw err;
    }
  },

  async sendReminderEmail(to, contact, reminderNote) {
    await this.sendEmail({
      to,
      subject: `Reminder: Follow up with ${contact.first_name} ${contact.last_name}`,
      html: `<p>This is a reminder to contact <strong>${contact.first_name} ${contact.last_name}</strong>.</p>
             ${reminderNote ? `<p>Note: ${reminderNote}</p>` : ''}`,
    });
  },

  async sendNotificationEmail(to, subject, message) {
    await this.sendEmail({
      to,
      subject,
      html: `<p>${message}</p>`,
    });
  },

  async sendPasswordReset(to, resetUrl) {
    const template = await loadTemplate('password_reset').catch(() => null);
    if (template) {
      const rendered = renderTemplate(template, { reset_url: resetUrl, email: to });
      await this.sendEmail({ to, subject: rendered.subject, html: rendered.html_body, text: rendered.text_body });
    } else {
      await this.sendEmail({
        to,
        subject: 'Password Reset Request',
        html: `<p>Click the link below to reset your password:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>This link expires in 1 hour.</p>`,
      });
    }
  },

  async loadTemplate(name) {
    return loadTemplate(name);
  },

  async getSmtpSettings() {
    return getSmtpSettings();
  },
};

module.exports = emailService;
