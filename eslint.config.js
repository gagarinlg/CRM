'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'src/client/dist/**',
      'src/server/logs/**',
      'src/client/**',
    ],
  },

  // Base recommended rules
  js.configs.recommended,

  // Server + test files
  {
    files: ['src/server/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-duplicate-imports': 'error',
    },
  },
];
