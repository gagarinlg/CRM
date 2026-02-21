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
    // Wait for navigation away from /contacts/new (not just any /contacts URL)
    await expect(page).toHaveURL(/\/contacts$/, { timeout: 10000 });
    // Wait for the table to appear before looking for the row
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
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

  test('can delete a contact', async ({ page }) => {
    // Create a contact to delete
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="first_name"]').fill('E2E');
    await page.locator('input[name="last_name"]').fill('DeleteMeContact');
    await page.locator('input[name="email"]').fill('e2edelete@example.com');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/contacts$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    // Find the row and click delete
    const row = page.locator('tr').filter({ hasText: 'DeleteMeContact' });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: /confirm/i }).click();
    await expect(page.locator('tr').filter({ hasText: 'DeleteMeContact' })).not.toBeVisible({ timeout: 8000 });
  });

  test('search filters the contact list', async ({ page }) => {
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    const searchBox = page.locator('input[placeholder]').first();
    await searchBox.fill('zzz_no_match_xyz_99999');
    await page.waitForTimeout(600);
    await expect(page.getByText(/no results|no contacts|0/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Contact detail page', () => {
  test.beforeEach(async ({ page }) => {
    // Create a contact and navigate to its detail
    await page.goto('/contacts/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="first_name"]').fill('E2E');
    await page.locator('input[name="last_name"]').fill('DetailViewContact');
    await page.locator('input[name="email"]').fill('e2edetailview@example.com');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/contacts$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('DetailViewContact').first().click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/, { timeout: 10000 });
  });

  test('contact detail shows info, projects, notes tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /info/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /projects/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 8000 });
  });

  test('contact detail shows avatar with initials', async ({ page }) => {
    // Avatar with initials should appear on the info tab
    await expect(page.locator('.MuiAvatar-root').first()).toBeVisible({ timeout: 8000 });
  });

  test('contact detail projects tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /projects/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('contact detail notes tab is navigable', async ({ page }) => {
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('contact detail back button returns to list', async ({ page }) => {
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL(/\/contacts$/, { timeout: 8000 });
  });
});

