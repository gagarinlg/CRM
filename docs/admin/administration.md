# CRM System — Administration Manual

> **Audience:** System administrators and managers with the **Admin** role.

---

## Table of Contents

1. [Accessing the Admin Area](#1-accessing-the-admin-area)
2. [User Management](#2-user-management)
   - 2.1 [Creating a User](#21-creating-a-user)
   - 2.2 [Editing a User](#22-editing-a-user)
   - 2.3 [Deactivating / Deleting a User](#23-deactivating--deleting-a-user)
   - 2.4 [Assigning Roles to a User](#24-assigning-roles-to-a-user)
   - 2.5 [Resetting a User's Password](#25-resetting-a-users-password)
3. [Groups & Visibility](#3-groups--visibility)
4. [Tags Management](#4-tags-management)
5. [Roles & Permissions](#5-roles--permissions)
   - 5.1 [Built-in Roles](#51-built-in-roles)
   - 5.2 [Permission Reference](#52-permission-reference)
   - 5.3 [Creating a Custom Role](#53-creating-a-custom-role)
6. [Two-Factor Authentication (2FA / TOTP)](#6-two-factor-authentication-2fa--totp)
7. [Email / SMTP Configuration](#7-email--smtp-configuration)
8. [Internationalisation (i18n)](#8-internationalisation-i18n)
9. [Reminder Settings](#9-reminder-settings)
10. [Reports & Exports](#10-reports--exports)
11. [Audit Log](#11-audit-log)
12. [System Information](#12-system-information)
13. [Database Migrations](#13-database-migrations)
14. [Backup & Restore](#14-backup--restore)
15. [Updating the Application](#15-updating-the-application)
16. [Service Management (systemd)](#16-service-management-systemd)
17. [Environment Variable Reference](#17-environment-variable-reference)

---

## 1. Accessing the Admin Area

The admin area is available in the left-hand sidebar under **Admin**. It is only visible to users with the **Admin** or **Manager** role.

Sub-sections in the sidebar:
| Sidebar item | Purpose |
|---|---|
| Admin → Users | Manage user accounts |
| Admin → Groups | Manage user groups |
| Admin → Roles | Manage roles and permissions |
| Admin → Translations | Edit UI translations |
| Admin → Settings | SMTP, reminders, system info |

---

## 2. User Management

### 2.1 Creating a User

1. Go to **Admin → Users**.
2. Click **Add User**.
3. Fill in:
   - **Username** (required, unique)
   - **Email** (required, unique)
   - **First / Last Name**
   - **Password** — must be ≥ 8 characters with at least one uppercase letter, one lowercase letter, and one number.
   - **Force password change on next login** — tick this box when creating accounts for others.
4. Click **Save**.
5. Assign a role immediately (see [2.4](#24-assigning-roles-to-a-user)).

### 2.2 Editing a User

1. Go to **Admin → Users** and click the user's row.
2. Edit the desired fields.
3. Click **Save**.

> **Changing a password:** Use the **Change Password** button on the user detail page. The user's old password is not required when an admin changes it.

### 2.3 Deactivating / Deleting a User

- **Deactivate:** Untick *Active* on the user's edit page. The user cannot log in but their data is preserved.
- **Delete:** Click the **Delete** (trash) icon on the user list. This is a soft-delete; the record is retained in the database with a `deleted_at` timestamp.

### 2.4 Assigning Roles to a User

1. Open the user's detail page (**Admin → Users → [user]**).
2. In the **Roles** section, click **Assign Role**.
3. Select a role from the dropdown and click **Add**.
4. Remove a role by clicking the **×** button next to it.

Changes take effect on the user's next request (no logout required).

### 2.5 Resetting a User's Password

**Via the Admin UI:**
1. Open the user's detail page.
2. Click **Reset Password**, enter a temporary password, and tick **Force password change**.
3. Communicate the temporary password to the user securely.

**Via the command line (emergency):**

```bash
sudo -u crm node -e "
const { hashPassword } = require('./src/server/utils/password');
const knex = require('knex')(require('./src/server/config/knexfile').production);
hashPassword('TempPass1').then(hash =>
  knex('users').where({ username: 'alice' })
    .update({ password_hash: hash, force_password_change: true })
).then(() => { console.log('Done'); knex.destroy(); });
"
```

---

## 3. Groups & Visibility

Groups let you organise users and control who can see restricted projects and leads.

### Creating and managing groups

1. Go to **Admin → Groups**.
2. Click **Add Group**, enter a name and optional description.
3. On the group's detail page:
   - **Members tab** — add/remove users.
   - **Roles tab** — assign roles to the group; all members inherit those permissions.

> Users inherit the union of all permissions from their individual roles **and** all groups they belong to.

### Group-based visibility for projects and leads

When creating or editing a **Project** or **Lead**, you can set the **Visibility** field to either:

| Setting | Who can see it |
|---------|---------------|
| **Public** | All users with the relevant `read` permission |
| **Restricted** | Only members of the assigned groups, direct members, and Admins/Managers |

To restrict a project or lead:
1. Open the project/lead form and set **Visibility** to **Restricted**.
2. In the **Groups** multi-select, choose which groups should have access.
3. Save the record.

> **Important:** Restricted records return a 404 (not a 403) to users without access, to prevent leaking the existence of confidential data.

---

## 4. Tags Management

Tags are colour-coded labels that can be attached to companies, contacts, projects, and leads. They are shared across the whole system.

### Creating and editing tags

1. Go to **Admin → Tags** (or manage tags inline from any entity's detail page).
2. Click **Add Tag**, enter a name and choose a colour.
3. Click **Save**.

Tags can be edited or deleted at any time. Deleting a tag removes it from all entities it was applied to.

### Applying tags to records

On any company, contact, project, or lead detail page:
1. Scroll to the **Tags** section.
2. Click the tag input box and select existing tags or create new ones.
3. Tags are saved immediately.

---

## 5. Roles & Permissions

### 5.1 Built-in Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access to all modules and administrative functions |
| **Manager** | Full CRUD on all business modules; view users; read settings; generate reports |
| **Sales** | Create/edit contacts, companies, and leads; manage own calendar |
| **User** | Read-only on most modules; can create/edit contacts and write notes |
| **ReadOnly** | View-only access to all modules |

### 5.2 Permission Reference

Permissions follow the format `<module>.<action>`.

| Module | Actions |
|--------|---------|
| `contacts` | `read`, `write`, `delete`, `admin` |
| `companies` | `read`, `write`, `delete`, `admin` |
| `projects` | `read`, `write`, `delete`, `admin` |
| `leads` | `read`, `write`, `delete`, `admin` |
| `notes` | `read`, `write`, `delete` |
| `calendar` | `read`, `write`, `delete` |
| `reports` | `read`, `generate` |
| `users` | `read`, `write`, `delete`, `admin` |
| `settings` | `read`, `write` |

### 5.3 Creating a Custom Role

1. Go to **Admin → Roles** and click **Add Role**.
2. Enter a name and optional description.
3. On the role's detail page, click **Add Permission** and select each permission from the list.
4. Assign the role to users or groups.

---

## 6. Two-Factor Authentication (2FA / TOTP)

### For individual users (self-service)

Users can enable TOTP 2FA from their own **Profile** page:

1. Click the user avatar → **Profile**.
2. Scroll to **Two-Factor Authentication** and click **Enable 2FA**.
3. Scan the QR code with an authenticator app (Google Authenticator, Authy, Bitwarden, etc.) or enter the text secret manually.
4. Enter the 6-digit code shown by the authenticator to confirm setup.
5. **Save the backup codes** displayed — they can be used once each if the authenticator is lost.

### Logging in with 2FA enabled

1. Enter username/email and password normally.
2. A second screen appears asking for the 6-digit TOTP code.
3. Enter the code from the authenticator app and click **Verify**.

### Disabling 2FA

1. Go to **Profile → Two-Factor Authentication**.
2. Click **Disable 2FA** and confirm with your current password.

### Admin: resetting a user's 2FA

If a user has lost access to their authenticator and backup codes:

```bash
sudo -u crm node -e "
const knex = require('knex')(require('./src/server/config/knexfile').production);
knex('users').where({ username: 'alice' })
  .update({ totp_enabled: false, totp_secret: null, totp_backup_codes: null })
  .then(() => { console.log('2FA cleared'); knex.destroy(); });
"
```

---

## 7. Email / SMTP Configuration

1. Go to **Admin → Settings → Email/SMTP**.
2. Fill in the SMTP server details:
   - **Host** — e.g. `smtp.gmail.com`
   - **Port** — `587` (STARTTLS) or `465` (SSL/TLS)
   - **Username** and **Password**
   - **From address** — e.g. `CRM System <noreply@yourdomain.com>`
3. Click **Test Connection** to send a test email to your own address.
4. Click **Save**.

> Alternatively, set SMTP settings via environment variables in `.env`  
> (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).  
> UI settings take precedence over environment variables when both are present.

### Email templates

Go to **Admin → Settings → Email Templates** to customise the HTML/text body of:
- Password reset emails
- Reminder notifications
- Assignment notifications

Templates support `{{ variable }}` placeholders (e.g. `{{ reset_url }}`, `{{ contact_name }}`).

---

## 8. Internationalisation (i18n)

The CRM ships with English (en), German (de), and Czech (cs) translations.

### Editing translations in the browser

1. Go to **Admin → Translations**.
2. Select a language from the dropdown.
3. Find the key you want to change (use the search box).
4. Click the key row, edit the **Value** field, and click **Save**.

Changes are live immediately — no server restart required.

### Adding a new language

1. Go to **Admin → Translations → Add Language**.
2. Enter the BCP-47 language code (e.g. `fr` for French) and a display name.
3. Add translations for each key (or copy from an existing language and edit).

### Adding new translation keys

For developers: see the Developer Guide.  
Admins can also add keys directly via **Admin → Translations → Add Key**.

---

## 9. Reminder Settings

Each user can configure their own contact reminder threshold (**Profile → Reminder Settings**). Admins can set a system-wide default via `API` or by editing the `reminder_settings` table directly.

| Setting | Default | Description |
|---------|---------|-------------|
| `days_threshold` | 30 | Warn when last contact was more than N days ago |
| `email_enabled` | true | Send reminder by email |
| `in_app_enabled` | true | Show reminder banner in app |

The reminder service runs on a configurable schedule (default: daily) and emails users about contacts that have not been reached within the threshold.

---

## 10. Reports & Exports

Reports are available under **Reports** in the main navigation (requires `reports.read` permission; generating/exporting requires `reports.generate`).

| Report | Description |
|--------|-------------|
| Sales | Revenue totals, won/lost leads by period |
| Lead Pipeline | Current pipeline value by stage |
| Project Status | Projects grouped by status |
| Contact Activity | Contacts by last-contact date |
| User Activity | Actions per user (Admin only) |

### Filtering reports

All reports accept:
- **Date range** — `from` and `to` date pickers
- **Format** — view in browser, export as **CSV**, or export as **PDF**

### Quick CSV export from list views

Projects and Leads list pages have an **Export CSV** button that downloads the current filtered list immediately, without needing to go to the Reports section.

### Bulk delete

All list views (Companies, Contacts, Projects, Leads, Users) support bulk delete:
1. Tick the checkboxes next to the records you want to remove.
2. Click the **Delete Selected** button that appears in the toolbar.
3. Confirm in the dialog.

Bulk delete requires the same `delete` permission as single-record delete.

---

## 11. Audit Log

Every sensitive action (user login, record creation/edit/delete, role changes) is written to the audit log.

Access it at **Admin → Settings → Audit Log** or query the database directly:

```sql
SELECT al.created_at, u.username, al.action, al.entity_type, al.entity_id
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;
```

---

## 12. System Information

Go to **Admin → Settings → System Info** to view:
- Application version
- Node.js version
- Database connection status
- Uptime
- Memory usage

---

## 13. Database Migrations

Migrations run automatically on application startup. To run them manually:

```bash
cd /opt/crm
sudo -u crm npm run migrate
```

To check migration status:

```bash
sudo -u crm npx knex --knexfile src/server/config/knexfile.js migrate:status
```

To roll back the last batch:

```bash
sudo -u crm npx knex --knexfile src/server/config/knexfile.js migrate:rollback
```

> **Never roll back in production without a backup.**

---

## 14. Backup & Restore

See the [Installation Guide — Backup & Restore](installation.md#10-backup--restore) section for full details.

Quick reference:

```bash
# Create a backup
sudo bash /opt/crm/scripts/backup.sh

# List backups
ls -lh /var/backups/crm/
```

---

## 15. Updating the Application

```bash
sudo bash /opt/crm/scripts/update.sh
```

The update script will:
1. Create a backup first
2. Stop the service
3. Pull the latest code / install new packages
4. Run pending migrations
5. Restart and health-check the service

See the [Installation Guide — Updating](installation.md#9-updating-the-application) for manual update steps.

---

## 16. Service Management (systemd)

```bash
# Status
sudo systemctl status crm

# Start / Stop / Restart
sudo systemctl start crm
sudo systemctl stop crm
sudo systemctl restart crm

# Enable/disable auto-start on boot
sudo systemctl enable crm
sudo systemctl disable crm

# View logs (live)
journalctl -u crm -f

# View logs (last 200 lines)
journalctl -u crm -n 200 --no-pager
```

---

## 17. Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | `production`, `development`, or `test` |
| `PORT` | No | `3000` | HTTP port the server listens on |
| `APP_VERSION` | No | `1.0.0` | Shown in `/health` and UI |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | `crm_db` | Database name |
| `DB_USER` | Yes | `crm_user` | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `DB_SSL` | No | `false` | Set to `true` for SSL connections to PostgreSQL |
| `DATABASE_URL` | No | — | Full connection string (production alternative) |
| `JWT_SECRET` | Yes | — | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for signing refresh tokens (different from above) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port (587 = STARTTLS, 465 = SSL) |
| `SMTP_USER` | No | — | SMTP username / email |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | — | From address, e.g. `CRM <noreply@example.com>` |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | URL of the frontend (used in CORS and emails) |
| `CORS_ORIGINS` | No | — | Comma-separated extra allowed origins (e.g. behind a reverse proxy) |
| `LOG_LEVEL` | No | `info` | `error`, `warn`, `info`, `debug` |
