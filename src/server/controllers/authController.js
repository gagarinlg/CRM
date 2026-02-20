'use strict';

const { body } = require('express-validator');
const authService = require('../services/authService');
const User = require('../models/User');
const { success, error } = require('../utils/response');
const { validate } = require('../middleware/validate');

const loginValidation = [
  body('identifier').notEmpty().withMessage('Email or username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required.'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

const totpVerifyLoginValidation = [
  body('pre_auth_token').notEmpty().withMessage('Pre-auth token is required.'),
  body('totp_token').notEmpty().withMessage('TOTP code is required.'),
];

const totpVerifySetupValidation = [
  body('totp_token').notEmpty().withMessage('TOTP code is required.'),
];

const totpDisableValidation = [
  body('password').notEmpty().withMessage('Password is required to disable 2FA.'),
];

const authController = {
  loginValidation,
  changePasswordValidation,

  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login(identifier, password, req.ip, req.get('User-Agent'));
      return success(res, result, 'Login successful.');
    } catch (err) {
      return next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const refreshToken = req.body.refresh_token;
      await authService.logout(req.user.id, refreshToken);
      return success(res, null, 'Logged out successfully.');
    } catch (err) {
      return next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) return error(res, 'Refresh token is required.', 400);
      const result = await authService.refreshToken(refresh_token);
      return success(res, result, 'Token refreshed.');
    } catch (err) {
      return next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      await authService.changePassword(req.user.id, current_password, new_password);
      return success(res, null, 'Password changed successfully.');
    } catch (err) {
      return next(err);
    }
  },

  async me(req, res) {
    const user = await User.findById(req.user.id);
    const roles = await User.getUserRoles(req.user.id);
    const permissions = await User.getUserPermissions(req.user.id);
    // Never expose the TOTP secret in /me
    const { totp_secret, totp_backup_codes, password_hash, ...safeUser } = user;
    return success(res, { ...safeUser, roles, permissions });
  },

  // ── TOTP 2FA ─────────────────────────────────

  /** POST /auth/2fa/setup — generate secret + QR (authenticated, TOTP not yet enabled) */
  async totpSetup(req, res, next) {
    try {
      const result = await authService.setupTotp(req.user.id);
      return success(res, result, '2FA setup initiated. Scan the QR code or enter the secret manually.');
    } catch (err) {
      return next(err);
    }
  },

  /** POST /auth/2fa/verify-setup — confirm token and enable 2FA */
  async totpVerifySetup(req, res, next) {
    try {
      const result = await authService.verifyTotpSetup(req.user.id, req.body.totp_token);
      return success(res, result, '2FA enabled. Store your backup codes in a safe place.');
    } catch (err) {
      return next(err);
    }
  },

  /** POST /auth/2fa/verify — complete login after TOTP step (public endpoint) */
  async totpVerifyLogin(req, res, next) {
    try {
      const { pre_auth_token, totp_token } = req.body;
      const result = await authService.verifyTotpLogin(pre_auth_token, totp_token, req.ip, req.get('User-Agent'));
      return success(res, result, 'Login successful.');
    } catch (err) {
      return next(err);
    }
  },

  /** POST /auth/2fa/disable — disable 2FA (requires password confirmation) */
  async totpDisable(req, res, next) {
    try {
      await authService.disableTotp(req.user.id, req.body.password);
      return success(res, null, '2FA disabled.');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = authController;
module.exports.totpVerifyLoginValidation = totpVerifyLoginValidation;
module.exports.totpVerifySetupValidation = totpVerifySetupValidation;
module.exports.totpDisableValidation = totpDisableValidation;
