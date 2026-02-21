// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Notes on a project', () => {
  test.beforeEach(async ({ page }) => {
    // Create a project and navigate to its detail → Notes tab
    await page.goto('/projects/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="name"]').fill('E2E Notes Test Project');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('E2E Notes Test Project').first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 10000 });
    // Navigate to Notes tab
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('notes tab shows add note button', async ({ page }) => {
    // The NotesList renders a "+" icon button for adding notes
    await expect(page.getByRole('button').filter({ has: page.locator('svg') }).first()).toBeVisible({ timeout: 8000 });
  });

  test('can add a note to a project', async ({ page }) => {
    // Click the add note (+) button in the NotesList
    // Try clicking any small icon button near the notes title
    const noteAddBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await noteAddBtn.click();
    // The inline note form should appear (textarea for content)
    const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea')).first();
    await expect(contentInput).toBeVisible({ timeout: 8000 });
    await contentInput.fill('E2E Playwright Note Content');
    await page.getByRole('button', { name: /save/i }).last().click();
    // Note should appear in the list
    await expect(page.getByText('E2E Playwright Note Content')).toBeVisible({ timeout: 10000 });
  });

  test('can delete a note from a project', async ({ page }) => {
    // First add a note
    const noteAddBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await noteAddBtn.click();
    const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea')).first();
    await expect(contentInput).toBeVisible({ timeout: 8000 });
    await contentInput.fill('E2E Note To Delete');
    await page.getByRole('button', { name: /save/i }).last().click();
    await expect(page.getByText('E2E Note To Delete')).toBeVisible({ timeout: 10000 });
    // Now delete it
    const noteCard = page.locator('.MuiCard-root').filter({ hasText: 'E2E Note To Delete' });
    await noteCard.getByRole('button', { name: /delete/i }).click();
    // Confirm the delete
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: /confirm/i }).click();
    // Note should be gone
    await expect(page.getByText('E2E Note To Delete')).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('Notes on a lead', () => {
  test.beforeEach(async ({ page }) => {
    // Create a lead and navigate to its Notes tab
    await page.goto('/leads/new', { waitUntil: 'load' });
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.locator('input[name="title"]').fill('E2E Notes Test Lead');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/leads$/, { timeout: 10000 });
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await page.getByText('E2E Notes Test Lead').first().click();
    await expect(page).toHaveURL(/\/leads\/[^/]+$/, { timeout: 10000 });
    await page.getByRole('tab', { name: /notes/i }).click();
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
  });

  test('can add a note to a lead', async ({ page }) => {
    const noteAddBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    await noteAddBtn.click();
    const contentInput = page.locator('textarea[name="content"]').or(page.locator('textarea')).first();
    await expect(contentInput).toBeVisible({ timeout: 8000 });
    await contentInput.fill('E2E Lead Note Content');
    await page.getByRole('button', { name: /save/i }).last().click();
    await expect(page.getByText('E2E Lead Note Content')).toBeVisible({ timeout: 10000 });
  });
});
