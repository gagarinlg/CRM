// @ts-check
const { test, expect } = require('@playwright/test');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Admin - Users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('shows the users admin page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('shows user list table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('has a New User button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new user|add user/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin - Roles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/roles');
  });

  test('shows the roles admin page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('shows roles table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('has a New Role button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new role|add role/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/groups');
  });

  test('shows the groups admin page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('shows groups table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('has a New Group button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new group|add group/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin - Translations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/translations');
  });

  test('shows the translations admin page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('shows translations and languages tabs', async ({ page }) => {
    await expect(page.getByRole('tab')).toHaveCount(2, { timeout: 8000 });
  });

  test('Languages tab shows the languages table', async ({ page }) => {
    await page.getByRole('tab', { name: /languages/i }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('Languages tab has New Language button', async ({ page }) => {
    await page.getByRole('tab', { name: /languages/i }).click();
    await expect(page.getByRole('button', { name: /new language/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings');
  });

  test('shows the settings admin page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });
});
