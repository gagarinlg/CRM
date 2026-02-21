// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Leads page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'networkidle' });
    await expect(page).not.toHaveURL(/login/);
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
    await page.goto('/leads/new', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 8000 });
  });
});
