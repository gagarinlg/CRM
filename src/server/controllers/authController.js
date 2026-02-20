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
    return success(res, { ...user, roles, permissions });
  },
};

module.exports = authController;
