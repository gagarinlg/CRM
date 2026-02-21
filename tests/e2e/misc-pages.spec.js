// @ts-check
const { test, expect } = require('@playwright/test');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Calendar page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('shows the calendar page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('has navigation buttons for month/week/day', async ({ page }) => {
    const hasView = await page.getByRole('button', { name: /month|week|day/i }).count();
    expect(hasView).toBeGreaterThan(0);
  });

  test('has a New Event button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new event|add event/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('shows the reports page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('shows the profile page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('shows personal info section', async ({ page }) => {
    await expect(page.getByLabel(/first name/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/last name/i)).toBeVisible();
  });

  test('shows change password section', async ({ page }) => {
    await expect(page.getByLabel(/current password/i)).toBeVisible({ timeout: 8000 });
  });

  test('shows language preference selector', async ({ page }) => {
    await expect(page.getByText(/interface language|language/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('shows 2FA section', async ({ page }) => {
    await expect(page.getByText(/two-factor|2fa/i)).toBeVisible({ timeout: 8000 });
  });
});
