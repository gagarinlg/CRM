// @ts-check
const { test, expect } = require('@playwright/test');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Guard: must not be redirected to login
    await expect(page).not.toHaveURL(/login/, { timeout: 8000 });
  });

  test('dashboard page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('main, [role="main"], #root')).toBeVisible();
  });

  test('sidebar navigation is present', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /companies/i })
        .or(page.getByRole('button', { name: /companies/i }))
        .or(page.getByText(/companies/i).first()),
    ).toBeVisible({ timeout: 8000 });
  });

  test('navigates to Companies page', async ({ page }) => {
    await page.goto('/companies');
    await expect(page).toHaveURL(/companies/);
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
