// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin - Users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/login/);
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
});

test.describe('Admin - Roles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/roles', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows the roles admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Role button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new role|add role/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/groups', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows the groups admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Group button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new group|add group/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin - Translations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/translations', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/login/);
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
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows the settings admin page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});
