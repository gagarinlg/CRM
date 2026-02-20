'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn',
    'no-duplicate-imports': 'error',
  },
  overrides: [
    {
      // Client-side React files use ESM; ignore them in server linting
      files: ['src/client/**/*.{js,jsx}'],
      env: { browser: true },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'no-undef': 'off' },
    },
    {
      files: ['tests/**/*.js', 'tests/**/*.spec.js'],
      env: { jest: true, node: true },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'src/client/dist/',
    'src/server/logs/',
  ],
};
