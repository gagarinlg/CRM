// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Projects page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/login/);
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
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 8000 });
  });
});
