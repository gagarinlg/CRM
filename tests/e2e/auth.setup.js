// @ts-check
/**
 * Authentication setup for Playwright tests.
 * Logs in once and saves browser storage state so all other test specs
 * can reuse the authenticated session without repeating the login flow.
 */
const { test: setup } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '.auth.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email or username/i).fill('admin');
  await page.getByLabel(/password/i).fill('Admin1234!');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation away from /login
  await page.waitForURL(/^(?!.*login)/, { timeout: 20000 });

  // Handle force-password-change redirect (should not occur in CI because
  // SEED_FORCE_PASSWORD_CHANGE=false, but guard it anyway)
  if (page.url().includes('change-password')) {
    await page.getByLabel(/current password/i).fill('Admin1234!');
    await page.getByLabel(/^new password/i).fill('Admin1234!');
    await page.getByLabel(/confirm/i).fill('Admin1234!');
    await page.getByRole('button', { name: /save|change/i }).click();
    await page.waitForURL(/^(?!.*change-password)/, { timeout: 10000 });
  }

  // Save the authenticated state for all subsequent tests
  await page.context().storageState({ path: AUTH_FILE });
});
