'use strict';

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'tests/e2e/.auth.json');

module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Do NOT run test files in parallel (one worker = no port conflicts) */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  /* No retries — failing tests should fail fast, not waste CI time */
  retries: 0,
  /* One worker to avoid port / DB race conditions */
  workers: 1,
  /* Cap the whole test suite at 5 minutes so CI never hangs indefinitely */
  globalTimeout: 5 * 60 * 1000,
  /* Per-test timeout */
  timeout: 30 * 1000,
  /* Reporter */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    /* Base URL of the running CRM app */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Collect trace on failure */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Default action timeout */
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
  },

  projects: [
    /* 1. Login once and save auth state */
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    /* 2. All other tests reuse the saved auth state */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.js/,
    },
  ],

  /* Start the dev server automatically if SKIP_SERVER_START is not set */
  ...(process.env.SKIP_SERVER_START
    ? {}
    : {
        webServer: {
          command: 'npm run dev --workspace=src/server',
          url: 'http://localhost:3000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      }),
});
