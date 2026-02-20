'use strict';

// Set required env vars before importing the module under test
process.env.JWT_SECRET = 'unit-test-access-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-32chars!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../../../src/server/utils/jwt');

describe('jwt utilities', () => {
  const payload = { sub: 'user-uuid-1234', email: 'test@example.com' };

  describe('generateAccessToken', () => {
    test('returns a three-part JWT string', () => {
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('accepts a custom expiry', () => {
      const token = generateAccessToken({ sub: 'x', pre_auth: true }, '5m');
      const decoded = verifyAccessToken(token);
      expect(decoded.pre_auth).toBe(true);
    });
  });

  describe('verifyAccessToken', () => {
    test('decodes a valid access token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe('user-uuid-1234');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.iss).toBe('crm-api');
    });

    test('throws JsonWebTokenError for a tampered token', () => {
      const token = generateAccessToken(payload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    test('throws for completely invalid string', () => {
      expect(() => verifyAccessToken('not.a.token')).toThrow();
    });

    test('throws for empty string', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });

  describe('generateRefreshToken / verifyRefreshToken', () => {
    test('refresh token round-trip works', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.sub).toBe('user-uuid-1234');
    });

    test('refresh token cannot be verified as access token', () => {
      const refreshToken = generateRefreshToken(payload);
      // Refresh secret !== access secret, so verifyAccessToken should throw
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });
});
