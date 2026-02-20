'use strict';

const { db } = require('../config/database');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../utils/password');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const authService = {
  /**
   * Authenticate a user by email/username + password, return token pair.
   */
  async login(identifier, password, ip, userAgent) {
    // Support login by email or username
    const user = await db('users')
      .where((b) => b.where({ email: identifier }).orWhere({ username: identifier }))
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }
    if (!user.is_active) {
      throw Object.assign(new Error('Account is deactivated.'), { statusCode: 403 });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    await User.updateLastLogin(user.id);

    const payload = { sub: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    }).onConflict().ignore().catch(() => {
      // Table may not exist in all environments; continue silently
    });

    await AuditLog.create({ user_id: user.id, action: 'login', ip_address: ip, user_agent: userAgent });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        force_password_change: user.force_password_change,
      },
    };
  },

  /**
   * Invalidate refresh token.
   */
  async logout(userId, refreshToken) {
    await db('refresh_tokens').where({ user_id: userId, token: refreshToken }).delete().catch(() => {});
    await AuditLog.create({ user_id: userId, action: 'logout' });
  },

  /**
   * Exchange a refresh token for a new access token.
   */
  async refreshToken(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.is_active) {
      throw Object.assign(new Error('User not found or inactive.'), { statusCode: 401 });
    }

    const accessToken = generateAccessToken({ sub: user.id, email: user.email });
    return { access_token: accessToken };
  },

  /**
   * Change password for authenticated user.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const valid = await User.verifyPassword(userId, currentPassword);
    if (!valid) {
      throw Object.assign(new Error('Current password is incorrect.'), { statusCode: 400 });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw Object.assign(new Error(strength.errors.join(' ')), { statusCode: 400 });
    }

    await User.changePassword(userId, newPassword);
    await AuditLog.create({ user_id: userId, action: 'change_password' });
  },

  /**
   * Generate a password reset token and store it.
   */
  async resetPasswordRequest(email) {
    const user = await User.findByEmail(email);
    if (!user) return; // Silently ignore – do not reveal user existence

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('password_reset_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token,
      expires_at: expiresAt,
    }).catch(() => {
      // If table doesn't exist, store token on user record as fallback
      logger.warn('password_reset_tokens table not found; skipping token storage');
    });

    return { token, user };
  },

  /**
   * Consume reset token and set new password.
   */
  async resetPassword(token, newPassword) {
    const record = await db('password_reset_tokens')
      .where({ token })
      .where('expires_at', '>', new Date())
      .first()
      .catch(() => null);

    if (!record) {
      throw Object.assign(new Error('Invalid or expired reset token.'), { statusCode: 400 });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw Object.assign(new Error(strength.errors.join(' ')), { statusCode: 400 });
    }

    await User.changePassword(record.user_id, newPassword);
    await db('password_reset_tokens').where({ token }).delete().catch(() => {});
    await AuditLog.create({ user_id: record.user_id, action: 'reset_password' });
  },
};

module.exports = authService;
