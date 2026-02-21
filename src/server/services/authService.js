'use strict';

const { db } = require('../config/database');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../utils/jwt');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../utils/password');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { generateSecret, verify: verifyTotp, generateURI } = require('otplib');
const qrcode = require('qrcode');

const authService = {
  /**
   * Authenticate a user by email/username + password.
   * If TOTP is enabled, returns requires_totp:true and a short-lived pre-auth token
   * instead of full access/refresh tokens.
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

    // If TOTP is enabled, issue a short-lived pre-auth token instead of full tokens.
    // The client must complete TOTP verification via POST /auth/2fa/verify.
    if (user.totp_enabled) {
      const preAuthToken = generateAccessToken({ sub: user.id, email: user.email, pre_auth: true }, '5m');
      await AuditLog.create({ user_id: user.id, action: 'login_totp_required', ip_address: ip, user_agent: userAgent });
      return {
        requires_totp: true,
        pre_auth_token: preAuthToken,
        user: { id: user.id, email: user.email, username: user.username },
      };
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

  // ──────────────────────────────────────────────
  // TOTP 2-Factor Authentication
  // ──────────────────────────────────────────────

  /**
   * Generate a new TOTP secret for the user and return:
   *  - secret   : base32 text secret (for manual entry into an authenticator)
   *  - qr_url   : otpauth:// URI
   *  - qr_image : data-URL PNG QR code ready for <img src="...">
   *
   * The secret is NOT yet saved; call verifyTotpSetup() to confirm and persist.
   */
  async setupTotp(userId) {
    const user = await User.findById(userId);
    if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });

    const secret = generateSecret();
    const appName = process.env.APP_NAME || 'CRM';
    const label = user.email;
    const uri = generateURI({ issuer: appName, label, secret });
    const qrImage = await qrcode.toDataURL(uri);

    // Store the pending secret temporarily on the user row (not yet enabled)
    await db('users').where({ id: userId }).update({ totp_secret: secret });

    return { secret, qr_url: uri, qr_image: qrImage };
  },

  /**
   * Verify a TOTP token against the pending secret and, if valid, enable 2FA.
   * Returns an array of 10 one-time backup codes (plain text, shown once).
   */
  async verifyTotpSetup(userId, token) {
    const user = await db('users').where({ id: userId }).first();
    if (!user || !user.totp_secret) {
      throw Object.assign(new Error('No pending TOTP setup found. Call setup first.'), { statusCode: 400 });
    }

    const result = await verifyTotp({ token, secret: user.totp_secret });
    if (!result || !result.valid) {
      throw Object.assign(new Error('Invalid TOTP code. Please check your authenticator app and try again.'), { statusCode: 400 });
    }

    // Generate 10 backup codes (plain text, hashed for storage)
    const plainCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );
    const hashedCodes = await Promise.all(plainCodes.map((c) => hashPassword(c)));

    await db('users').where({ id: userId }).update({
      totp_enabled: true,
      totp_backup_codes: JSON.stringify(hashedCodes),
    });

    await AuditLog.create({ user_id: userId, action: 'totp_enabled' });

    return { backup_codes: plainCodes };
  },

  /**
   * Complete login for a user who has TOTP enabled.
   * Accepts either a 6-digit TOTP token or a backup code.
   * Requires the pre_auth_token issued during the first login step.
   */
  async verifyTotpLogin(preAuthToken, totpToken, ip, userAgent) {
    let decoded;
    try {
      decoded = verifyAccessToken(preAuthToken);
    } catch {
      throw Object.assign(new Error('Invalid or expired pre-auth token.'), { statusCode: 401 });
    }

    if (!decoded.pre_auth) {
      throw Object.assign(new Error('Token is not a pre-auth token.'), { statusCode: 401 });
    }

    const user = await db('users').where({ id: decoded.sub }).whereNull('deleted_at').first();
    if (!user || !user.is_active) {
      throw Object.assign(new Error('User not found or inactive.'), { statusCode: 401 });
    }

    // Try TOTP token first
    const totpResult = await verifyTotp({ token: totpToken, secret: user.totp_secret }).catch(() => ({ valid: false }));

    if (!totpResult || !totpResult.valid) {
      // Try backup codes
      const backupCodes = user.totp_backup_codes
        ? JSON.parse(user.totp_backup_codes)
        : [];

      let usedIndex = -1;
      for (let i = 0; i < backupCodes.length; i++) {
        const match = await comparePassword(totpToken.replace(/-/g, '').toUpperCase(), backupCodes[i]);
        if (match) { usedIndex = i; break; }
      }

      if (usedIndex === -1) {
        throw Object.assign(new Error('Invalid TOTP code.'), { statusCode: 401 });
      }

      // Invalidate used backup code
      backupCodes.splice(usedIndex, 1);
      await db('users').where({ id: user.id }).update({ totp_backup_codes: JSON.stringify(backupCodes) });
    }

    await User.updateLastLogin(user.id);

    const payload = { sub: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      id: uuidv4(), user_id: user.id, token: refreshToken, expires_at: expiresAt,
    }).onConflict().ignore().catch(() => {});

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
   * Disable TOTP for a user (requires current password confirmation).
   */
  async disableTotp(userId, password) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Password is incorrect.'), { statusCode: 400 });

    await db('users').where({ id: userId }).update({
      totp_secret: null,
      totp_enabled: false,
      totp_backup_codes: null,
    });

    await AuditLog.create({ user_id: userId, action: 'totp_disabled' });
  },
};

module.exports = authService;
