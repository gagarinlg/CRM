'use strict';

module.exports = {
  testEnvironment: 'node',
  // Only run tests in tests/unit/ by default (no DB required)
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  collectCoverageFrom: [
    'src/server/**/*.js',
    '!src/server/migrations/**',
    '!src/server/seeds/**',
    '!src/server/index.js',
    '!src/server/config/knexfile.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      // Unit tests cover utils (100%), routes (100%), middleware, controllers, and models.
      // Services and deep model logic require integration tests (see CI e2e job).
      lines: 35,
      functions: 13,
      branches: 19,
      statements: 35,
    },
  },
  // Map ESM-only packages to CJS stubs so Jest (CommonJS mode) can load them
  moduleNameMapper: {
    '^otplib$': '<rootDir>/tests/__mocks__/otplib.js',
    '^qrcode$': '<rootDir>/tests/__mocks__/qrcode.js',
  },
  // Silence verbose module logs during tests
  silent: false,
  verbose: true,
};
