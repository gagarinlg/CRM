// @ts-check
const { test, expect } = require('./fixtures');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Companies page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the companies list page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Company button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new company|add company/i })).toBeVisible({ timeout: 10000 });
  });

  test('opens the new company form', async ({ page }) => {
    await page.getByRole('button', { name: /new company|add company/i }).click();
    await expect(page).toHaveURL(/companies\/new/, { timeout: 8000 });
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/companies/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 8000 });
  });
});
