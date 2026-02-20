// @ts-check
const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Contacts page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/contacts');
  });

  test('shows the contacts list page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('has a New Contact button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new contact|add contact/i })).toBeVisible({ timeout: 8000 });
  });

  test('opens the new contact form', async ({ page }) => {
    await page.getByRole('button', { name: /new contact|add contact/i }).click();
    await expect(page).toHaveURL(/contacts\/new/, { timeout: 5000 });
    // First name and last name fields should be visible
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
  });

  test('contact form requires first name', async ({ page }) => {
    await page.goto('/contacts/new');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5000 });
  });

  test('contact form has add phone number button', async ({ page }) => {
    await page.goto('/contacts/new');
    await expect(page.getByRole('button', { name: /add phone/i })).toBeVisible({ timeout: 5000 });
  });
});
