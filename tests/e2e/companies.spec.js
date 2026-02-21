// @ts-check
const { test, expect } = require('@playwright/test');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Companies page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies');
  });

  test('shows the companies list page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('has a New Company button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new company|add company/i })).toBeVisible({ timeout: 8000 });
  });

  test('opens the new company form', async ({ page }) => {
    await page.getByRole('button', { name: /new company|add company/i }).click();
    await expect(page).toHaveURL(/companies\/new/, { timeout: 5000 });
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/companies/new');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5000 });
  });
});
