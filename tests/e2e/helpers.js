// @ts-check
/**
 * Shared authentication helper for Playwright e2e tests.
 * Most tests do NOT call this — they rely on the saved storageState produced by
 * auth.setup.js (configured in playwright.config.js as the 'setup' project).
 *
 * loginAs() is only needed in tests that deliberately exercise the login flow
 * (e.g. login.spec.js), or in local-dev runs where no storageState exists yet.
 */
const { expect } = require('@playwright/test');

/**
 * Log in with given credentials and wait until we navigate away from /login.
 * Handles the force-password-change redirect automatically.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
async function loginAs(page, username = 'admin', password = 'Admin1234!') {
  await page.goto('/login');
  await page.getByLabel(/email or username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for actual navigation away from /login (success) or stay on /login (failure)
  // Using waitForURL with a negative lookahead so we wait for a URL that is NOT /login
  try {
    await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });
  } catch {
    // Still on /login — the assertion below will produce a clear error message
  }

  // If force-password-change redirect, complete it once
  if (page.url().includes('change-password')) {
    await page.getByLabel(/current password/i).fill(password);
    await page.getByLabel(/^new password/i).fill(password);
    await page.getByLabel(/confirm/i).fill(password);
    await page.getByRole('button', { name: /save|change/i }).click();
    await page.waitForURL(/^(?!.*change-password)/, { timeout: 10000 });
  }

  // Final guard: must not be on the login page
  await expect(page).toHaveURL(/^(?!.*login)/, { timeout: 5000 });
}

module.exports = { loginAs };
