# GitHub Copilot Instructions

This file contains project-specific rules that GitHub Copilot must follow when
suggesting or generating code for this repository.

---

## 1. Project Overview

A Node.js / Express + React CRM application backed by PostgreSQL (Knex.js
migrations). Key directories:

```
src/server/           – Express backend
  controllers/        – request handlers (thin, delegate to models/services)
  models/             – database access (Knex queries)
  routes/             – Express routers
  middleware/         – auth (verifyToken, requirePermission, requireRole)
  migrations/         – numbered Knex migrations (NNN_description.js)
  services/           – business logic (authService, emailService, …)
  utils/response.js   – success / error / paginated / notFound / unauthorized / forbidden

src/client/src/       – React 18 + MUI v5 frontend
  components/         – reusable UI components
  pages/              – page-level components (one per route)
  i18n/               – I18nContext (t(), useTranslation, changeLocale)
  store/              – AuthContext (user, isAdminUser, login, logout)

tests/unit/           – Jest unit tests (no database, no browser)
tests/e2e/            – Playwright browser tests
docs/admin/           – Installation + administration documentation
docs/user/            – End-user manual
```

---

## 2. Internationalisation (i18n) — MANDATORY

### 2.1 All user-visible strings must go through `t()`

Every string displayed in the UI **must** be translated. Hard-coded strings in
JSX are forbidden.

```jsx
// ✅ correct
import { useTranslation } from '../../i18n/I18nContext';
const { t } = useTranslation();
<Button>{t('common.save')}</Button>

// ❌ wrong
<Button>Save</Button>
```

### 2.2 Translation keys

- Keys follow the `module.camelCaseName` convention, e.g. `projects.notFound`,
  `common.save`, `auth.loginFailed`.
- Every new key must be added for **all three languages**: `en`, `de`, `cs`.

### 2.3 Adding new translation keys — always use a migration

Create a new numbered migration file in `src/server/migrations/` that inserts
the new keys into the `translations` table.  Follow the pattern of the existing
migration files (e.g. `NNN_add_missing_translations.js`):

```js
'use strict';

const KEYS = [
  { key: 'module.myNewKey', module: 'module', en: 'English text', de: 'Deutscher Text', cs: 'Český text' },
];
const LANGS = ['en', 'de', 'cs'];

exports.up = async (knex) => {
  const rows = [];
  for (const k of KEYS) {
    for (const lang of LANGS) {
      rows.push({ language_code: lang, module: k.module, key: k.key, value: k[lang] });
    }
  }
  await knex('translations').insert(rows).onConflict(['language_code', 'key']).ignore();
};

exports.down = async (knex) => {
  await knex('translations').whereIn('key', KEYS.map(k => k.key)).delete();
};
```

### 2.5 Yup validation messages must also use `t()`

Every validation message in a Yup schema **must** be a translated string, not a
hard-coded English literal. Because Yup schemas need `t()` from the component
context, define them **inside** the component with `useMemo`:

```jsx
// ✅ correct — schema defined inside component with t()
import { useMemo } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export default function MyForm() {
  const { t } = useTranslation();
  const schema = useMemo(() => yup.object({
    name: yup.string().required(t('validation.nameRequired')),
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
  }), [t]);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  // ...
}

// ❌ wrong — module-level schema with hard-coded English
const schema = yup.object({ name: yup.string().required('Name is required') });
```

Reuse existing keys where they already exist (e.g. `auth.minPassword`,
`auth.passwordsMustMatch`, `errors.required`) before adding new ones. All new
validation keys belong in the `validation` module.

### 2.4 Backend strings that end up in the UI

When the backend creates text that the frontend displays (e.g. audit notes from
`leadsController.convertToProject`), query the `translations` table using the
requesting user's `preferred_language`, with English as fallback. Do **not**
hard-code a language map inline — use the `lookupLabel` pattern already in
`leadsController.js`.

---

## 3. Code Quality — Readability and Maintainability

- Use clear, descriptive variable and function names. Avoid abbreviations unless
  they are industry-standard (`id`, `req`, `res`, `url`).
- Keep functions short (≤ 40 lines). Extract helpers when a function grows
  beyond that.
- Each controller method follows the same pattern:
  1. Validate input / check existence (`findById` → `notFound` if missing).
  2. Check authorisation (`checkProjectAccess` / `checkLeadAccess`).
  3. Perform the operation.
  4. Write an audit log entry.
  5. Return with the appropriate response helper.
- Always use `'use strict';` at the top of every server-side file.
- Use `async/await` — do not mix with `.then()` chains.
- Use the response helpers in `src/server/utils/response.js` — never call
  `res.status(...).json(...)` directly.
- Prefer named exports in server code; default exports are acceptable in React
  components.

---

## 4. Backend Patterns

### 4.1 Response helpers (always use these)

```js
const { success, error, paginated, notFound, unauthorized, forbidden } = require('../utils/response');

success(res, data, 'Optional message', 201);   // 200 or custom status
paginated(res, rows, total, page, limit);       // list endpoints
notFound(res, 'Project not found.');            // 404
error(res, 'Validation failed.', 400, errors); // client errors
forbidden(res, 'Access denied.');              // 403
unauthorized(res);                              // 401
```

### 4.2 Audit logging (always log sensitive operations)

```js
await AuditLog.create({
  user_id: req.user.id,
  action:  'create_project',          // snake_case verb_noun
  entity_type: 'project',
  entity_id:   project.id,
  old_values:  existing ?? null,
  new_values:  project,
  ip_address:  req.ip,
});
```

Required for: create, update, delete, bulk-delete, login, password change,
permission changes, and any security-sensitive operation.

### 4.3 Group-based access control

Projects and leads support restricted visibility. Every controller method that
reads or writes a restricted project/lead **must** call `checkProjectAccess` /
`checkLeadAccess` after `findById`. Return `notFound` (not `forbidden`) so that
the existence of the record is not leaked:

```js
const project = await Project.findById(req.params.id);
if (!project) return notFound(res, 'Project not found.');
if (!(await checkProjectAccess(req.user, project))) return notFound(res, 'Project not found.');
```

The `checkProjectAccess` helper queries `group_members` and `project_groups` to
determine whether the user is a member of any group that the project is assigned
to, and also checks direct `project_members` membership and admin role.

### 4.4 Route middleware order

Every route must have, in order:
1. `verifyToken` — validates the JWT.
2. `requirePermission('resource.action')` — e.g. `requirePermission('projects.read')`.

```js
router.get('/',     verifyToken, requirePermission('projects.read'),   controller.list);
router.post('/',    verifyToken, requirePermission('projects.write'),  controller.create);
router.delete('/:id', verifyToken, requirePermission('projects.delete'), controller.delete);
```

### 4.5 Database migrations

- File names: `NNN_short_description.js` where `NNN` is the next sequential
  three-digit number.
- Always implement both `exports.up` and `exports.down`.
- Use `knex.schema` for DDL; use `knex('table').insert(...)` for seed-like data.
- Never alter a migration file that has already been committed — add a new one.

---

## 5. Frontend Patterns

### 5.1 AuthContext

```jsx
import { useAuth } from '../../store/AuthContext';
const { user, isAdminUser } = useAuth();
```

`isAdminUser` is `true` when the user has the `admin` or `manager` role.

### 5.2 API calls

Use the central `api` instance from `src/client/src/services/api.js`. It
automatically attaches the JWT and handles 401 token refresh.

```js
import api from '../../services/api';
const res = await api.get('/projects');
```

### 5.3 Error handling in components

On 404 from the API, display a translated "not found" message:

```jsx
} catch (err) {
  if (err.response?.status === 404) setError(t('projects.notFound'));
  else setError(t('errors.loadFailed'));
}
```

### 5.4 Tags

Use `<EntityTags entityType="project" entityId={id} />` (or `"lead"`) to show
and manage tags on any detail page. The component handles all API calls and
renders coloured chips.

### 5.5 Global search

`<GlobalSearchDialog open={open} onClose={...} />` provides the full-text
search UI. Trigger it from the search icon in `TopBar`.

---

## 6. Testing

### 6.1 Unit tests (Jest)

- Location: `tests/unit/controllers/<name>.test.js`
- No real database — mock `src/server/config/database` and all model modules.
- Follow the mock setup at the top of existing test files (see
  `tests/unit/controllers/projects.test.js`).
- Every new controller method needs at least:
  - A happy-path test (returns expected data).
  - A not-found test (returns 404).
  - An error-propagation test (calls `next(err)`).
- Cover the access-control path for restricted resources (admin passes,
  non-member gets 404).
- Run with: `npm test` or `npm run test:coverage`.

### 6.2 E2E tests (Playwright)

- Location: `tests/e2e/<feature>.spec.js`
- All tests rely on the saved auth state from `tests/e2e/auth.setup.js`. Import
  `{ test, expect }` from `@playwright/test` — do not call `loginAs()` in
  regular tests.
- Use role-based locators (`getByRole`, `getByLabel`, `getByText`) over CSS
  selectors.
- Every new user-facing feature needs at least one Playwright test that:
  - Creates the resource (or navigates to it).
  - Verifies it appears in the list / detail view.
  - Deletes (or changes) it and confirms the change.
- Run with: `npm run test:e2e`.

### 6.3 Coverage targets

Aim for ≥80% line coverage on server-side code. The CI pipeline uploads a
coverage report as an artifact on every run.

---

## 7. Documentation

When adding or changing a user-facing feature, **always** update the relevant
documentation file(s):

| Change | Update |
|--------|--------|
| New feature visible to end users | `docs/user/user-manual.md` |
| New admin setting, migration step, or server config | `docs/admin/administration.md` |
| New installation step, env variable, or Docker change | `docs/admin/installation.md` |
| New npm script, major dependency, or architecture change | `README.md` |

Add screenshots to the documentation where possible using relative image paths
(e.g. `![Tags on project](../screenshots/project-tags.png)`).

---

## 8. Security

- Never commit secrets, credentials, or API keys. Use environment variables
  (see `.env.example`).
- Validate all user input with `express-validator` before using it in queries.
- Use parameterised Knex queries — never interpolate user input into raw SQL.
- Passwords must be hashed with bcryptjs (already handled by
  `src/server/utils/password.js`).
- Tokens are JWT with configurable secrets from `JWT_SECRET` /
  `JWT_REFRESH_SECRET` env vars.
- Rate limiting is applied globally in `app.js` — do not remove it.
- Helmet and CORS are configured in `app.js` — do not remove them.
- Restricted resources must return `404` (not `403`) to avoid leaking existence
  to unauthorised users.

---

## 9. Git and CI

- The CI pipeline runs: lint → unit tests with coverage → E2E tests.
- All three jobs must be green before merging.
- Commit messages should follow the imperative mood: `Add tag support to leads`,
  not `Added tag support`.
- Never force-push to `main` or `master`.
- Branch names for automated Copilot work follow the pattern `copilot/<topic>`.
