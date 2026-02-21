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
    await expect(page).toHaveURL(/\/leads$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
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

  test('can delete a lead', async ({ page }) => {
    // Create a lead to delete
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="title"]').fill('E2E Delete Me Lead');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Click the delete button for this specific row
    const row = page.locator('tr').filter({ hasText: 'E2E Delete Me Lead' });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: /confirm/i }).click();
    // Row should be gone
    await expect(page.locator('tr').filter({ hasText: 'E2E Delete Me Lead' })).not.toBeVisible({ timeout: 8000 });
  });

  test('search filters the lead list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    const searchBox = page.locator('input[placeholder]').first();
    await searchBox.fill('zzz_no_match_xyz_99999');
    await page.waitForTimeout(600);
    await expect(page.getByText(/no results|no leads|0/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('can convert a lead to a project', async ({ page }) => {
    // Create a lead first
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="title"]').fill('Lead to Convert');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Navigate to the lead detail
    const row = page.getByText('Lead to Convert').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    await expect(page).toHaveURL(/\/leads\/[^/]+$/, { timeout: 8000 });
    // The "Convert to Project" button should be visible
    const convertBtn = page.getByRole('button', { name: /convert to project/i });
    await expect(convertBtn).toBeVisible({ timeout: 10000 });
    // Click it to open the confirmation dialog
    await convertBtn.click();
    // Confirm dialog should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    // Click the confirm button inside the dialog
    await dialog.getByRole('button', { name: /convert/i }).click();
    // Should navigate to the new project
    await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 15000 });
  });
});

test.describe('Lead detail page', () => {
  test.beforeEach(async ({ page }) => {
    // Create a fresh lead and navigate to its detail
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="title"]').fill('E2E Lead Detail Test');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('E2E Lead Detail Test').first().click();
    await expect(page).toHaveURL(/\/leads\/[^/]+$/, { timeout: 10000 });
  });

  test('lead detail shows info, contacts, members, notes tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /info/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /contacts/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /members/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 8000 });
  });

  test('lead detail shows stage selector on info tab', async ({ page }) => {
    // The stage selector (Select) is on the Info tab
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: 8000 });
  });

  test('lead detail stage can be changed', async ({ page }) => {
    // Open the stage dropdown — nth(1) skips the language selector in the TopBar
    const stageSelect = page.getByRole('combobox').nth(1);
    await stageSelect.click();
    await page.getByRole('option', { name: /contacted/i }).click();
    // The chip/select value should update
    await expect(page.getByText(/contacted/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('lead detail contacts tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /contacts/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('lead detail back button returns to list', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/leads$/, { timeout: 8000 });
  });

  test('lead detail edit button navigates to edit form', async ({ page }) => {
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/leads\/[^/]+\/edit/, { timeout: 8000 });
    await expect(page.locator('input[name="title"]')).toHaveValue('E2E Lead Detail Test', { timeout: 8000 });
  });
});

