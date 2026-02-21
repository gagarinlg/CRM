// @ts-check
const { test, expect } = require('./fixtures');
// Auth state is provided by auth.setup.js via playwright.config.js storageState

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // Guard: must not be redirected to login (React is fully loaded at this point)
    await expect(page).not.toHaveURL(/login/);
  });

  test('dashboard page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('main, [role="main"], #root')).toBeVisible();
  });

  test('sidebar navigation is present', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /companies/i })
        .or(page.getByRole('button', { name: /companies/i }))
        .or(page.getByText(/companies/i).first()),
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
