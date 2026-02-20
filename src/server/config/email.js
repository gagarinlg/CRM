'use strict';

require('dotenv').config();

const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @param {string} to - Recipient address(es).
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body.
 * @param {string} [text] - Plain-text fallback.
 * @returns {Promise<object>} nodemailer info object.
 */
async function sendEmail(to, subject, html, text) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    ...(text && { text }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, { error: err.message });
    throw err;
  }
}

module.exports = { transporter, sendEmail };
