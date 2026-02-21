// @ts-check
/**
 * Authentication setup for Playwright tests.
 *
 * Uses a direct API call instead of UI interaction to log in. This is more
 * reliable in headless Chromium because:
 *  - It avoids MUI floating-label discovery issues with page.getByLabel()
 *  - It avoids the axios 401-interceptor full-page redirect that occurs when
 *    UI login fails and causes page.waitForURL() to hang
 *  - It is fast (~200 ms vs up to 20 s for UI-based login)
 */
const { test: setup, expect } = require('@playwright/test');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '.auth.json');

setup('authenticate as admin', async ({ page, request }) => {
  // ── Step 1: obtain tokens via the REST API ─────────────────────────────────
  const res = await request.post('/api/v1/auth/login', {
    data: { identifier: 'admin', password: 'Admin1234!' },
  });

  // Fail fast with a descriptive error if the API returns non-2xx
  expect(res.ok(), `Login API returned ${res.status()}: ${await res.text()}`).toBeTruthy();

  const body = await res.json();
  const { access_token: accessToken, refresh_token: refreshToken } = body.data;

  // ── Step 2: load the login page to establish the correct localStorage origin
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // ── Step 3: inject tokens into localStorage ─────────────────────────────────
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem('accessToken', at);
      if (rt) localStorage.setItem('refreshToken', rt);
    },
    { at: accessToken, rt: refreshToken },
  );

  // ── Step 4: navigate to the app root and wait until the document is loaded.
  //            We use 'load' instead of 'networkidle' because React makes
  //            multiple API calls after mount (i18n, auth/me, dashboard data)
  //            that keep the network busy indefinitely in CI, causing a timeout.
  await page.goto('/', { waitUntil: 'load' });
  // Wait for the main content area – proves React hydrated and ProtectedRoute
  // rendered the real shell (not a spinner or redirect).
  await page.waitForSelector('main, [role="main"], #root > *', { timeout: 15000 });

  // Guard: must not have been redirected to /login
  await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

  // Guard: authenticated shell must be visible before saving state
  await expect(
    page.locator('nav, [role="navigation"], aside').or(page.locator('main, [role="main"]'))
  ).toBeVisible({ timeout: 15000 });

  // ── Step 5: persist the browser storage state for all subsequent tests ──────
  await page.context().storageState({ path: AUTH_FILE });
});
