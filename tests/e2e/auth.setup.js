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
  // Using the `request` fixture calls baseURL + path directly, so this hits
  // Express at http://localhost:3000/api/v1/auth/login in CI.
  const res = await request.post('/api/v1/auth/login', {
    data: { identifier: 'admin', password: 'Admin1234!' },
  });

  // Fail fast with a descriptive error if the API returns non-2xx
  // (e.g. wrong password in seed, DB not ready, etc.) instead of a 20-second
  // waitForURL timeout that hides the real cause.
  expect(res.ok(), `Login API returned ${res.status()}: ${await res.text()}`).toBeTruthy();

  const body = await res.json();
  const { access_token: accessToken, refresh_token: refreshToken } = body.data;

  // ── Step 2: load the app to establish the correct origin for localStorage ──
  // Navigating to /login (an unauthenticated page) is the safest way to get
  // the SPA shell loaded before we inject tokens.
  await page.goto('/login');

  // ── Step 3: inject tokens into localStorage ─────────────────────────────────
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem('accessToken', at);
      if (rt) localStorage.setItem('refreshToken', rt);
    },
    { at: accessToken, rt: refreshToken },
  );

  // ── Step 4: navigate to the dashboard and confirm we are authenticated ──────
  await page.goto('/');
  await page.waitForURL(/^(?!.*login)/, { timeout: 15000 });

  // ── Step 5: persist the browser storage state for all subsequent tests ──────
  await page.context().storageState({ path: AUTH_FILE });
});
