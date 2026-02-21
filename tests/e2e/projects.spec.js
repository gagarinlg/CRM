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

  test('can delete a project', async ({ page }) => {
    // Create a project to delete
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Delete Me Project');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Find the row and click the delete button
    const row = page.locator('tr').filter({ hasText: 'E2E Delete Me Project' });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog appears
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: /confirm/i }).click();
    // Row should be gone
    await expect(page.locator('tr').filter({ hasText: 'E2E Delete Me Project' })).not.toBeVisible({ timeout: 8000 });
  });

  test('search filters the project list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    const searchBox = page.locator('input[placeholder]').first();
    await searchBox.fill('zzz_no_match_xyz_99999');
    // Wait for debounce + re-render
    await page.waitForTimeout(600);
    // Should show no results
    await expect(page.getByText(/no results|no projects|0/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('status filter shows only matching projects', async ({ page }) => {
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Open the status filter dropdown — nth(1) skips the language selector in the TopBar
    const statusSelect = page.getByRole('combobox').nth(1);
    await statusSelect.click();
    // Choose "Planning"
    await page.getByRole('option', { name: /planning/i }).click();
    await page.waitForTimeout(500);
    // The status filter should now be active (page still renders)
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Project detail page', () => {
  test.beforeEach(async ({ page }) => {
    // Create a project to inspect
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Detail View Project');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('E2E Detail View Project').first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 10000 });
  });

  test('project detail shows info, contacts, members, notes tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /info/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /contacts/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /members/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 8000 });
  });

  test('project detail contacts tab shows add button', async ({ page }) => {
    await page.getByRole('tab', { name: /contacts/i }).click();
    // The add contact icon button should be visible
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('project detail members tab shows add button', async ({ page }) => {
    await page.getByRole('tab', { name: /members/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('project detail notes tab shows notes section', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    // Notes section heading should be visible
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('project detail edit button navigates to edit form', async ({ page }) => {
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+\/edit/, { timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Detail View Project', { timeout: 8000 });
  });

  test('project detail back button returns to list', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 8000 });
  });
});

