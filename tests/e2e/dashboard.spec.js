// @ts-check
const { test, expect } = require('./fixtures');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // Wait for the authenticated layout — proves /auth/me completed and ProtectedRoute rendered
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
  });

  test('dashboard page loads without error', async ({ page }) => {
    // Verify dashboard rendered content — not stuck in error/loading state
    await expect(page.locator('.MuiGrid-root, .MuiCard-root').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('sidebar navigation is present', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /companies/i })
        .or(page.getByRole('button', { name: /companies/i }))
        .or(page.getByText(/companies/i))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('navigates to Companies page', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'load' });
    await expect(page).toHaveURL(/companies/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('navigates to Contacts page', async ({ page }) => {
    await page.goto('/contacts', { waitUntil: 'load' });
    await expect(page).toHaveURL(/contacts/);
    await expect(page).not.toHaveURL(/login/);
  });

  test('navigates to Projects page', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'load' });
    await expect(page).toHaveURL(/projects/);
    await expect(page).not.toHaveURL(/login/);
  });
});
