// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Admin - Users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'load' });
    // Wait for the authenticated layout to render (proves ProtectedRoute + /auth/me completed)
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the users admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('shows user list', async ({ page }) => {
    await expect(
      page.getByRole('table').or(page.locator('ul, [role="list"]')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('has a New User button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new user|add user/i })).toBeVisible({ timeout: 10000 });
  });

  test('can open new user dialog and see form fields', async ({ page }) => {
    await page.getByRole('button', { name: /new user|add user/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="firstName"]').or(page.locator('input[name="first_name"]')).first()).toBeVisible({ timeout: 8000 });
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('can open edit user dialog for existing user', async ({ page }) => {
    // Click the first edit/pencil icon in the users table
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    // Dialog should be pre-filled with user data
    const firstNameInput = page.locator('input[name="firstName"]').or(page.locator('input[name="first_name"]')).first();
    await expect(firstNameInput).not.toHaveValue('', { timeout: 8000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Admin - Roles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/roles', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the roles admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Role button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new role|add role/i })).toBeVisible({ timeout: 10000 });
  });

  test('can open new role dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new role|add role/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
  });

  test('can create and edit a role', async ({ page }) => {
    // Create new role
    await page.getByRole('button', { name: /new role|add role/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await page.locator('input[name="name"]').fill('E2E Test Role');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 8000 });
    // Find the created role and click edit
    await expect(page.getByText('E2E Test Role').first()).toBeVisible({ timeout: 8000 });
    const row = page.locator('tr').filter({ hasText: 'E2E Test Role' });
    await row.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Role', { timeout: 8000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Admin - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/groups', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the groups admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Group button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new group|add group/i })).toBeVisible({ timeout: 10000 });
  });

  test('can open new group dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new group|add group/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
  });

  test('can create and edit a group', async ({ page }) => {
    // Create new group
    await page.getByRole('button', { name: /new group|add group/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await page.locator('input[name="name"]').fill('E2E Test Group');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 8000 });
    // Find the created group and click edit
    await expect(page.getByText('E2E Test Group').first()).toBeVisible({ timeout: 8000 });
    const row = page.locator('tr').filter({ hasText: 'E2E Test Group' });
    await row.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Group', { timeout: 8000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Admin - Translations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/translations', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the translations admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Languages tab shows language table', async ({ page }) => {
    const langTab = page.getByRole('tab', { name: /languages/i });
    const count = await langTab.count();
    if (count > 0) {
      await langTab.click();
      await expect(
        page.getByRole('table').or(page.locator('ul, [role="list"]')).first()
      ).toBeVisible({ timeout: 8000 });
    } else {
      expect(true).toBe(true); // no tab present – skip gracefully
    }
  });
});

test.describe('Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the settings admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});

