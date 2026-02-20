'use strict';

// Jest-compatible CJS stub for otplib (the real package uses ESM internally)
const generateSecret = jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP');
const generate = jest.fn().mockResolvedValue('123456');
const verify = jest.fn().mockResolvedValue({ valid: true, delta: 0 });
const generateURI = jest.fn().mockReturnValue('otpauth://totp/CRM:test%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=CRM');

module.exports = {
  generateSecret,
  generate,
  verify,
  generateURI,
};
