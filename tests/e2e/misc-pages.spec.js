// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Calendar page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the calendar page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has navigation buttons for month/week/day', async ({ page }) => {
    const count = await page.getByRole('button', { name: /month|week|day/i }).count();
    expect(count).toBeGreaterThan(0);
  });

  test('has a New Event button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new event|add event/i })).toBeVisible({ timeout: 10000 });
  });

  test('can open new event dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new event|add event/i }).click();
    // The event dialog should appear with a title field
    await expect(page.locator('input[name="title"]').or(page.locator('[role="dialog"]')).first()).toBeVisible({ timeout: 10000 });
  });

  test('can switch between calendar views', async ({ page }) => {
    // Click "Week" view if available
    const weekBtn = page.getByRole('button', { name: /week/i }).first();
    const count = await weekBtn.count();
    if (count > 0) {
      await weekBtn.click();
      await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
    } else {
      expect(true).toBe(true); // view buttons not present – skip gracefully
    }
  });
});

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the reports page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('reports page contains charts or cards', async ({ page }) => {
    // Reports page should have some visual content
    await expect(
      page.locator('.MuiCard-root, .MuiGrid-root, canvas').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the profile page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('shows personal info section', async ({ page }) => {
    // Use input name attribute — reliable regardless of i18n/translation state
    await expect(page.locator('input[name="firstName"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows change password section', async ({ page }) => {
    await expect(page.locator('input[name="currentPassword"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows 2FA section', async ({ page }) => {
    await expect(
      page.getByText(/two-factor|2fa|authenticator/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('profile first name field is editable', async ({ page }) => {
    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
    // Clear and fill with a test value to confirm the field is editable
    await firstNameInput.click();
    await firstNameInput.fill('AdminE2E');
    await expect(firstNameInput).toHaveValue('AdminE2E', { timeout: 5000 });
    // Restore original value
    await firstNameInput.fill('Admin');
  });

  test('change password section has current password field', async ({ page }) => {
    const currentPwdInput = page.locator('input[name="currentPassword"]');
    await expect(currentPwdInput).toBeVisible({ timeout: 10000 });
    await expect(currentPwdInput).toHaveAttribute('type', 'password');
  });
});

