// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows the login form', async ({ page }) => {
    // CRM brand visible
    await expect(page.getByText('CRM')).toBeVisible();

    // Sign-in heading
    await expect(page.getByText('Sign in to your account')).toBeVisible();

    // Email / username input
    await expect(page.getByLabel(/email or username/i)).toBeVisible();

    // Password input
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // At least one validation message should appear
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/email or username/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('WrongPass1!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // An error alert should appear (API returns 401)
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    // Use the default seed admin credentials
    await page.getByLabel(/email or username/i).fill('admin');
    await page.getByLabel(/password/i).fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should land on dashboard or change-password page
    await expect(page).toHaveURL(/(dashboard|change-password|\/)/, { timeout: 8000 });
  });
});
