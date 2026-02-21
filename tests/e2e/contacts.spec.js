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
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('contact form has add phone number button', async ({ page }) => {
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /add phone/i })).toBeVisible({ timeout: 8000 });
  });

  test('can create and edit a contact', async ({ page }) => {
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="first_name"]').fill('E2E');
    await page.locator('input[name="last_name"]').fill('TestContact');
    await page.locator('input[name="email"]').fill('e2econtact@example.com');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/contacts/, { timeout: 10000 });
    // Find and navigate to the created contact
    const row = page.getByText('TestContact').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/, { timeout: 8000 });
    // Click edit
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+\/edit/, { timeout: 8000 });
    // Verify form is pre-filled
    await expect(page.locator('input[name="first_name"]')).toHaveValue('E2E', { timeout: 8000 });
    await expect(page.locator('input[name="last_name"]')).toHaveValue('TestContact', { timeout: 8000 });
    // Update
    await page.locator('input[name="last_name"]').fill('UpdatedContact');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/contacts/, { timeout: 10000 });
  });
});

