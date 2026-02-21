// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Contacts page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('shows the contacts list page', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('has a New Contact button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new contact|add contact/i })).toBeVisible({ timeout: 10000 });
  });

  test('opens the new contact form', async ({ page }) => {
    await page.getByRole('button', { name: /new contact|add contact/i }).click();
    await expect(page).toHaveURL(/contacts\/new/, { timeout: 8000 });
  });

  test('contact form requires fields', async ({ page }) => {
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 8000 });
  });

  test('contact form has add phone number button', async ({ page }) => {
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /add phone/i })).toBeVisible({ timeout: 8000 });
  });
});
