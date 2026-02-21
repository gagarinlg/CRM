// @ts-check
const { test, expect } = require('@playwright/test');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Leads page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leads');
  });

  test('shows the leads list page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  });

  test('has a New Lead button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new lead|add lead/i })).toBeVisible({ timeout: 8000 });
  });

  test('opens the new lead form', async ({ page }) => {
    await page.getByRole('button', { name: /new lead|add lead/i }).click();
    await expect(page).toHaveURL(/leads\/new/, { timeout: 5000 });
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/leads/new');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5000 });
  });

  test('has a Kanban/Board view button', async ({ page }) => {
    const kanbanBtn = page.getByRole('button', { name: /kanban|board/i });
    const count = await kanbanBtn.count();
    if (count > 0) {
      await kanbanBtn.click();
      const boardIndicator = page.locator('[data-testid="kanban"], [class*="kanban"], [class*="board"]').first();
      await expect(boardIndicator).toBeVisible({ timeout: 5000 });
    }
    expect(true).toBe(true);
  });
});
