// @ts-check
const { test, expect } = require('@playwright/test');

// These tests assume a logged-in session. Log in before each test.
test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    // Perform login
    await page.goto('/login');
    await page.getByLabel(/email or username/i).fill('admin');
    await page.getByLabel(/password/i).fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wait for navigation away from the login page
    await page.waitForURL(/(\/|dashboard|change-password)/, { timeout: 10000 });
    // If force-change-password redirect, skip the test
    if (page.url().includes('change-password')) {
      test.skip();
    }
  });

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/');
    // The page should not show an error
    await expect(page.locator('body')).not.toContainText('Error');
    // Should have a heading or content area
    await expect(page.locator('main, [role="main"], #root')).toBeVisible();
  });

  test('sidebar navigation is present', async ({ page }) => {
    await page.goto('/');
    // Check for common navigation links
    await expect(
      page.getByRole('link', { name: /companies/i })
        .or(page.getByRole('button', { name: /companies/i }))
        .or(page.getByText(/companies/i).first()),
    ).toBeVisible({ timeout: 6000 });
  });

  test('navigates to Companies page', async ({ page }) => {
    await page.goto('/companies');
    await expect(page).toHaveURL(/companies/);
    // Should not redirect to login
    await expect(page).not.toHaveURL(/login/);
  });

  test('navigates to Contacts page', async ({ page }) => {
    await page.goto('/contacts');
    await expect(page).toHaveURL(/contacts/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('navigates to Projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/projects/);
    await expect(page).not.toHaveURL(/login/);
  });
});
