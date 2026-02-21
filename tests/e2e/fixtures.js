// @ts-check
/**
 * Authenticated test fixture for Playwright e2e tests.
 *
 * WHY addInitScript instead of storageState:
 *   storageState is applied by Playwright at browser-context creation time.
 *   In CI, React's very first useEffect (AuthContext.loadUser → GET /auth/me)
 *   can execute before Playwright has fully restored the localStorage from the
 *   storageState file, causing a brief window where localStorage is empty.
 *   When loadUser finds no accessToken it immediately sets loading:false and
 *   user:null → ProtectedRoute redirects to /login instantly.
 *
 *   page.addInitScript() is guaranteed to run BEFORE any page JavaScript,
 *   including React's module initialisation, so the tokens are always present
 *   when AuthContext reads them.
 */
const { test: base, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const AUTH_FILE = path.join(__dirname, '.auth.json');

/**
 * Read the saved localStorage items from auth.json.
 * Returns an empty array when the file does not exist yet (first run).
 */
function readAuthItems() {
  if (!fs.existsSync(AUTH_FILE)) return [];
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    return state.origins?.[0]?.localStorage || [];
  } catch {
    return [];
  }
}

/**
 * `test` fixture that automatically injects accessToken + refreshToken into
 * localStorage before any page script runs.  All authenticated spec files
 * should import { test, expect } from this module.
 */
const test = base.extend({
  page: async ({ page }, use) => {
    const items = readAuthItems();
    if (items.length > 0) {
      // addInitScript fires before any page-level JavaScript executes.
      await page.addInitScript((localStorage_items) => {
        localStorage_items.forEach(({ name, value }) => {
          localStorage.setItem(name, value);
        });
      }, items);
    }
    await use(page);
  },
});

module.exports = { test, expect };
