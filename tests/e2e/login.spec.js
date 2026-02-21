// @ts-check
const { test, expect } = require('@playwright/test');

// login.spec.js tests the login form itself — start with no auth state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows the login form', async ({ page }) => {
    await expect(page.getByText('CRM')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel(/email or username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/email or username/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('WrongPass1!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
  });

  test('successful login redirects away from login page', async ({ page }) => {
    await page.getByLabel(/email or username/i).fill('admin');
    await page.getByLabel(/password/i).fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/^(?!.*login)/, { timeout: 15000 });
  });
});
