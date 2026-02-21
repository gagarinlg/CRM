// @ts-check
/**
 * Shared authentication helper for Playwright e2e tests.
 * Call loginAs(page) at the start of each test that requires auth.
 */
const { expect } = require('@playwright/test');

/**
 * Log in with default admin credentials and wait until the dashboard loads.
 * In CI the seed is run with SEED_ADMIN_PASSWORD=Admin1234! and
 * SEED_FORCE_PASSWORD_CHANGE=false, so no password-change step is needed.
 * When running against a freshly seeded dev DB (password 'changeme',
 * force_password_change=true) this helper also handles the change-password
 * redirect automatically.
 */
async function loginAs(page, username = 'admin', password = 'Admin1234!') {
  await page.goto('/login');
  await page.getByLabel(/email or username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation away from /login (success, error-stays, or change-password)
  await page.waitForURL(/.*/, { timeout: 12000 });

  // If force-password-change redirect, complete it once
  if (page.url().includes('change-password')) {
    await page.getByLabel(/current password/i).fill(password);
    await page.getByLabel(/new password/i).first().fill('Admin1234!');
    await page.getByLabel(/confirm/i).fill('Admin1234!');
    await page.getByRole('button', { name: /change|save/i }).click();
    // Wait until redirected away from change-password
    await page.waitForURL(/^(?!.*change-password).*$/, { timeout: 10000 });
  }

  // Final guard: must not be on the login page
  await expect(page).toHaveURL(/^(?!.*login).*$/, { timeout: 10000 });
}

module.exports = { loginAs };
