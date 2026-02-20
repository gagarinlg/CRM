'use strict';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* One worker on CI to avoid port conflicts */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    /* Base URL of the running CRM app */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Collect trace on first retry */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the dev server automatically if SKIP_SERVER_START is not set */
  ...(process.env.SKIP_SERVER_START
    ? {}
    : {
        webServer: [
          {
            command: 'npm run dev --workspace=src/server',
            url: 'http://localhost:3000/health',
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
          },
          {
            command: 'npm run dev --workspace=src/client',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
          },
        ],
      }),
});
