// @ts-check
/**
 * Documentation screenshot generator.
 *
 * Visits every major page of the CRM and saves a PNG to docs/user/screenshots/.
 * Run this spec whenever the UI changes and screenshots need to be refreshed:
 *
 *   SKIP_SERVER_START=1 npx playwright test tests/e2e/screenshots.spec.js
 *
 * Screenshots are committed to the repository and referenced from
 * docs/user/user-manual.md.
 */
const { test } = require('./fixtures');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/user/screenshots');

/** Take a full-page screenshot and save it under SCREENSHOTS_DIR. */
async function shot(page, filename) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
    fullPage: false,
  });
}

/** Wait for the main content area to be fully rendered. */
async function waitForMain(page) {
  await page.waitForSelector('main, [role="main"]', { timeout: 20000 });
  // Allow React to finish any data fetches
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Documentation screenshots', () => {
  test.slow(); // these tests are intentionally slow — they load many pages

  test('01-login', async ({ browser }) => {
    // Use a brand-new context with no auth tokens to show the real login page
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('form', { timeout: 10000 });
    await shot(p, '01-login.png');
    await ctx.close();
  });

  test('02-dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '02-dashboard.png');
  });

  test('03-companies-list', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    await shot(page, '03-companies-list.png');
  });

  test('04-company-detail', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'load' });
    await waitForMain(page);
    // Click the first company row to open its detail page
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 10000 });
    await firstRow.click();
    await waitForMain(page);
    await shot(page, '04-company-detail.png');
  });

  test('05-contacts-list', async ({ page }) => {
    await page.goto('/contacts', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    await shot(page, '05-contacts-list.png');
  });

  test('06-contact-detail', async ({ page }) => {
    await page.goto('/contacts', { waitUntil: 'load' });
    await waitForMain(page);
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 10000 });
    await firstRow.click();
    await waitForMain(page);
    await shot(page, '06-contact-detail.png');
  });

  test('07-projects-list', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    await shot(page, '07-projects-list.png');
  });

  test('08-project-detail', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'load' });
    await waitForMain(page);
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 10000 });
    await firstRow.click();
    await waitForMain(page);
    await shot(page, '08-project-detail.png');
  });

  test('09-leads-list', async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    await shot(page, '09-leads-list.png');
  });

  test('10-leads-kanban', async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'load' });
    await waitForMain(page);
    // Switch to Kanban view if button exists
    const kanbanBtn = page.getByRole('button', { name: /kanban/i });
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, '10-leads-kanban.png');
  });

  test('11-lead-detail', async ({ page }) => {
    await page.goto('/leads', { waitUntil: 'load' });
    await waitForMain(page);
    // Make sure we're on the list view
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.count() > 0) await listBtn.click();
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 10000 });
    await firstRow.click();
    await waitForMain(page);
    await shot(page, '11-lead-detail.png');
  });

  test('12-calendar', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForTimeout(1500); // allow FullCalendar to fully render
    await shot(page, '12-calendar.png');
  });

  test('13-reports', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '13-reports.png');
  });

  test('14-profile', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '14-profile.png');
  });

  test('15-admin-users', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'load' });
    await waitForMain(page);
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    await shot(page, '15-admin-users.png');
  });

  test('16-admin-settings', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '16-admin-settings.png');
  });

  test('17-global-search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await waitForMain(page);
    // Open global search dialog
    const searchBtn = page.getByRole('button', { name: /search/i }).first();
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      await page.waitForTimeout(500);
      // Type something to populate results
      const searchInput = page.locator('[role="dialog"] input, [role="search"] input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('Acme');
        await page.waitForTimeout(800);
      }
    }
    await shot(page, '17-global-search.png');
  });

  test('18-new-user-form', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'load' });
    await waitForMain(page);
    await page.getByRole('button', { name: /new user|add user/i }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
    await page.waitForTimeout(300);
    await shot(page, '18-new-user-form.png');
    await page.keyboard.press('Escape');
  });

  test('19-new-company-form', async ({ page }) => {
    await page.goto('/companies/new', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '19-new-company-form.png');
  });

  test('20-new-lead-form', async ({ page }) => {
    await page.goto('/leads/new', { waitUntil: 'load' });
    await waitForMain(page);
    await shot(page, '20-new-lead-form.png');
  });
});
