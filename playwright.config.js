'use strict';

const { defineConfig, devices } = require('@playwright/test');

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
  /* Cap the whole test suite at 15 minutes so CI never hangs indefinitely.
   * Each of the ~50 tests has a 20s beforeEach + 30s test timeout; 15 min is
   * generous headroom for a CI runner that is slower than a developer laptop. */
  globalTimeout: 15 * 60 * 1000,
  /* Per-test timeout */
  timeout: 30 * 1000,
  /* Default assertion timeout – must be at the top level (not under use:) to
   * take effect. Give React enough time to complete the /auth/me round-trip
   * and render the authenticated layout before assertions fire. */
  expect: { timeout: 20 * 1000 },
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
    /* 1. Login once and save auth state (tokens → tests/e2e/.auth.json) */
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    /* 2. All other tests inject auth tokens via addInitScript (fixtures.js).
     *    storageState is NOT set here so login.spec.js gets a clean context
     *    (no leftover tokens that would redirect the login page to the dashboard). */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
