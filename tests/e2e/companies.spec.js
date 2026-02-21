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
    // After save, should redirect to list (not /new, not /uuid)
    await expect(page).toHaveURL(/\/companies$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
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

  test('can delete a company', async ({ page }) => {
    // Create a company to delete
    await page.goto('/companies/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Delete Me Corp');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Find the row and click delete
    const row = page.locator('tr').filter({ hasText: 'E2E Delete Me Corp' });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: /confirm/i }).click();
    await expect(page.locator('tr').filter({ hasText: 'E2E Delete Me Corp' })).not.toBeVisible({ timeout: 8000 });
  });

  test('search filters the company list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    const searchBox = page.locator('input[placeholder]').first();
    await searchBox.fill('zzz_no_match_xyz_99999');
    await page.waitForTimeout(600);
    await expect(page.getByText(/no results|no companies|0/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Company detail page', () => {
  test.beforeEach(async ({ page }) => {
    // Create a company and navigate to its detail
    await page.goto('/companies/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Company Detail Test');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('E2E Company Detail Test').first().click();
    await expect(page).toHaveURL(/\/companies\/[^/]+$/, { timeout: 10000 });
  });

  test('company detail shows info, contacts, projects, leads, notes tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /info/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /contacts/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /projects/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /leads/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 8000 });
  });

  test('company detail contacts tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /contacts/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('company detail projects tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /projects/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('company detail leads tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /leads/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('company detail notes tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('company detail back button returns to list', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 8000 });
  });
});

