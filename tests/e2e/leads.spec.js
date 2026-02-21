// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Leads page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the leads list page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Lead button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new lead|add lead/i })).toBeVisible({ timeout: 10000 });
  });

  test('opens the new lead form', async ({ page }) => {
    await page.getByRole('button', { name: /new lead|add lead/i }).click();
    await expect(page).toHaveURL(/leads\/new/, { timeout: 8000 });
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('can create and edit a lead', async ({ page }) => {
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="title"]').fill('E2E Test Lead');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads/, { timeout: 10000 });
    // Find and navigate to lead
    const row = page.getByText('E2E Test Lead').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    await expect(page).toHaveURL(/\/leads\/[^/]+$/, { timeout: 8000 });
    // Click edit
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/leads\/[^/]+\/edit/, { timeout: 8000 });
    // Verify pre-fill
    await expect(page.locator('input[name="title"]')).toHaveValue('E2E Test Lead', { timeout: 8000 });
    // Update
    await page.locator('input[name="title"]').fill('E2E Test Lead Updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads/, { timeout: 10000 });
  });
});

