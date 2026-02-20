// @ts-check
const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Projects page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/projects');
  });

  test('shows the projects list page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('has a New Project button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new project|add project/i })).toBeVisible({ timeout: 8000 });
  });

  test('opens the new project form', async ({ page }) => {
    await page.getByRole('button', { name: /new project|add project/i }).click();
    await expect(page).toHaveURL(/projects\/new/, { timeout: 5000 });
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/projects/new');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5000 });
  });
});
