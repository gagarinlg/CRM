// @ts-check
/**
 * auth.spec.js – tests for unauthenticated redirect and logout.
 *
 * The unauthenticated describe uses an empty storageState so that no tokens
 * exist in localStorage (mirrors the login.spec.js approach).
 *
 * The logout describe uses the authenticated fixture from fixtures.js.
 */
const { test: baseTest, expect } = require('@playwright/test');
const { test: authTest } = require('./fixtures');

// ── Unauthenticated redirect tests ───────────────────────────────────────────
// Override storageState to ensure we have a clean (no-auth) context.
baseTest.describe('Unauthenticated access', () => {
  baseTest.use({ storageState: { cookies: [], origins: [] } });

  baseTest.beforeEach(async ({ page }) => {
    // Clear any tokens that might exist
    await page.goto('about:blank');
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* blank page – ignore */ }
    });
  });

  baseTest('redirects to /login when accessing the dashboard without auth', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });

  baseTest('redirects to /login when accessing /projects without auth', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });

  baseTest('redirects to /login when accessing /leads without auth', async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });

  baseTest('redirects to /login when accessing an admin page without auth', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });
});

// ── Logout test (requires authenticated session) ─────────────────────────────
authTest.describe('Logout', () => {
  authTest.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  authTest('logout redirects to the login page', async ({ page }) => {
    // Open the user avatar menu in the top bar
    await page.locator('.MuiAvatar-root').first().click();
    // The menu should show with a Logout option
    const logoutItem = page.getByRole('menuitem', { name: /logout|sign out/i });
    await expect(logoutItem).toBeVisible({ timeout: 8000 });
    await logoutItem.click();
    // Should redirect to /login
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });
});
