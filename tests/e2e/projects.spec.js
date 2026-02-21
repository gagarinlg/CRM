// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Projects page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the projects list page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Project button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new project|add project/i })).toBeVisible({ timeout: 10000 });
  });

  test('opens the new project form', async ({ page }) => {
    await page.getByRole('button', { name: /new project|add project/i }).click();
    await expect(page).toHaveURL(/projects\/new/, { timeout: 8000 });
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('new project form has visibility selector', async ({ page }) => {
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    // Visibility field should exist (public/restricted)
    await expect(page.locator('label').filter({ hasText: /visibility/i })).toBeVisible({ timeout: 8000 });
  });

  test('can create and edit a project', async ({ page }) => {
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Test Project');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Find and navigate to the created project
    const row = page.getByText('E2E Test Project').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 8000 });
    // Click edit
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+\/edit/, { timeout: 8000 });
    // Verify form is pre-filled
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Project', { timeout: 8000 });
    // Update name
    await page.locator('input[name="name"]').fill('E2E Test Project Updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 });
  });
});

