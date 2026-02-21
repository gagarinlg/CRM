// @ts-check
const { test, expect } = require('@playwright/test');

// login.spec.js tests the login form itself — start with no auth state.
// Since the chromium project no longer sets storageState, each context starts
// fresh. The test.use override below makes this intent explicit and ensures
// no tokens bleed in from any other source.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any auth tokens that may exist from a previous navigation
    await page.goto('about:blank');
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* ignore - blank page has no storage */ }
    });
    await page.goto('/login');
    // Wait for React to render the login form
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  });

  test('shows the login form', async ({ page }) => {
    await expect(page.getByText('CRM')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('input[name="email"]').fill('nobody@example.com');
    await page.locator('input[name="password"]').fill('WrongPass1!');
    await page.getByRole('button', { name: /sign in/i }).click();
    // With the axios interceptor fix, a 401 from /auth/login shows an alert
    // instead of triggering a full-page redirect back to /login
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
  });

  test('successful login redirects away from login page', async ({ page }) => {
    await page.locator('input[name="email"]').fill('admin');
    await page.locator('input[name="password"]').fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/^(?!.*login)/, { timeout: 15000 });
  });
});
