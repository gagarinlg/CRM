'use strict';

const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} = require('../../../src/server/utils/password');

describe('password utilities', () => {
  describe('hashPassword', () => {
    test('returns a bcrypt hash string', async () => {
      const hash = await hashPassword('Test1234');
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2')).toBe(true);
    });

    test('hash is different from the plain-text password', async () => {
      const hash = await hashPassword('Test1234');
      expect(hash).not.toBe('Test1234');
    });

    test('same password produces different hashes (salt)', async () => {
      const h1 = await hashPassword('Test1234');
      const h2 = await hashPassword('Test1234');
      expect(h1).not.toBe(h2);
    });
  });

  describe('comparePassword', () => {
    test('returns true when password matches hash', async () => {
      const hash = await hashPassword('SecurePass1');
      const result = await comparePassword('SecurePass1', hash);
      expect(result).toBe(true);
    });

    test('returns false when password does not match hash', async () => {
      const hash = await hashPassword('SecurePass1');
      const result = await comparePassword('WrongPassword', hash);
      expect(result).toBe(false);
    });

    test('returns false for empty string against a real hash', async () => {
      const hash = await hashPassword('SecurePass1');
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('valid strong password passes', () => {
      const { valid, errors } = validatePasswordStrength('Password1');
      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    test('rejects password shorter than 8 characters', () => {
      const { valid, errors } = validatePasswordStrength('Ab1');
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('8 characters'))).toBe(true);
    });

    test('rejects password with no uppercase letter', () => {
      const { valid, errors } = validatePasswordStrength('password1');
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('uppercase'))).toBe(true);
    });

    test('rejects password with no lowercase letter', () => {
      const { valid, errors } = validatePasswordStrength('PASSWORD1');
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('lowercase'))).toBe(true);
    });

    test('rejects password with no number', () => {
      const { valid, errors } = validatePasswordStrength('PasswordAbc');
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('number'))).toBe(true);
    });

    test('returns multiple errors for very weak password', () => {
      const { valid, errors } = validatePasswordStrength('abc');
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});
