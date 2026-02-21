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
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('can create and edit a company', async ({ page }) => {
    // Create
    await page.goto('/companies/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Test Corp');
    await page.getByRole('button', { name: /save/i }).click();
    // After save, should redirect to list
    await expect(page).toHaveURL(/\/companies/, { timeout: 10000 });
    // Find the created company and click edit
    const row = page.getByText('E2E Test Corp').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    // Navigate to the company detail
    await row.click();
    await expect(page).toHaveURL(/\/companies\/[^/]+$/, { timeout: 8000 });
    // Click edit
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/companies\/[^/]+\/edit/, { timeout: 8000 });
    // Verify form is pre-filled
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Corp', { timeout: 8000 });
    // Edit name
    await page.locator('input[name="name"]').fill('E2E Test Corp Updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/companies/, { timeout: 10000 });
  });
});

