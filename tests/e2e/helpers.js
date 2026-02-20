// @ts-check
/**
 * Shared authentication helper for Playwright e2e tests.
 * Call loginAs(page) at the start of each test that requires auth.
 */
const { expect } = require('@playwright/test');

/**
 * Log in with default admin credentials and wait until the dashboard loads.
 * Handles the "change password" redirect if the seed forces it.
 */
async function loginAs(page, username = 'admin', password = 'Admin1234!') {
  await page.goto('/login');
  await page.getByLabel(/email or username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // If forced password change is required, handle it
  const url = page.url();
  if (url.includes('change-password')) {
    await page.getByLabel(/current password/i).fill(password);
    await page.getByLabel(/new password/i).first().fill('Admin1234!');
    await page.getByLabel(/confirm/i).fill('Admin1234!');
    await page.getByRole('button', { name: /change/i }).click();
  }

  // Wait until we are past login
  await expect(page).toHaveURL(/^(?!.*login).*$/, { timeout: 10000 });
}

module.exports = { loginAs };
