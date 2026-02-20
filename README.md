# CRM System

A production-ready Customer Relationship Management system built with **Node.js**, **Express**, **PostgreSQL**, and **React**.

---

## Features

- **Companies & Contacts** — full CRUD, linked contacts with multiple phone numbers and required email
- **Projects** — linked to companies, contacts, and team members
- **Leads** — sales funnel with Kanban view and pipeline analytics
- **Notes** — rich-text notes on companies, contacts, projects, and leads
- **Calendar** — month/week/day view with recurring events and CalDAV sync
- **Dashboard** — configurable widgets with KPIs, charts, and activity feeds
- **Reports** — PDF and CSV export (sales, pipeline, project status, contact activity)
- **User & Group Management** — role-based access control (RBAC) with granular permissions
- **Two-Factor Authentication (TOTP)** — QR-code setup, backup codes, admin reset
- **Internationalisation** — English, German, and Czech; translations editable in the browser
- **Email system** — Nodemailer with SMTP configuration in the admin UI and email templates
- **Contact Reminders** — configurable "last contact" thresholds with email and in-app alerts
- **Audit Log** — every sensitive operation is recorded

---

## Documentation

| Document | Audience |
|----------|----------|
| [Installation Guide](docs/admin/installation.md) | System administrators |
| [Administration Manual](docs/admin/administration.md) | Admins and managers |
| [User Manual](docs/user/user-manual.md) | All users |

---

## Quick Start

### Option A — Docker Compose (easiest)

```bash
cp .env.example .env
# Edit .env: set JWT_SECRET, JWT_REFRESH_SECRET, and optionally SMTP settings
nano .env

docker compose up -d

# First time only: run migrations and seed
docker compose exec app npm run migrate
docker compose exec app npm run seed
```

Open `http://localhost:3000` and log in with **admin** / **changeme**.  
You will be prompted to change your password on first login.

### Option B — Ubuntu server (production)

```bash
# On a fresh Ubuntu 22.04 / 24.04 server, as root:
sudo bash scripts/install.sh
```

See the full [Installation Guide](docs/admin/installation.md) for detailed steps.

### Option C — Local development

```bash
# Prerequisites: Node.js 20+, PostgreSQL 14+

git clone https://github.com/gagarinlg/CRM.git
cd CRM

cp .env.example .env
# Edit .env with your local database credentials and JWT secrets

npm install
npm run migrate
npm run seed

# Start backend (port 3000)
npm run dev

# In a second terminal: start frontend (port 5173)
npm run dev --workspace=src/client
```

---

## Project Structure

```
.
├── docs/
│   ├── admin/
│   │   ├── installation.md       ← Installation & server setup
│   │   └── administration.md     ← Admin operations manual
│   └── user/
│       └── user-manual.md        ← End-user guide
├── scripts/
│   ├── install.sh                ← Automated Ubuntu installer
│   ├── update.sh                 ← Update script (backup + migrate + restart)
│   └── backup.sh                 ← Database backup script
├── src/
│   ├── server/                   ← Node.js / Express backend
│   │   ├── config/               ← Database, knex, logger, email config
│   │   ├── controllers/          ← Request handlers
│   │   ├── middleware/           ← Auth, validation, error handling
│   │   ├── migrations/           ← Knex database migrations
│   │   ├── models/               ← Database access layer
│   │   ├── routes/               ← Express routers
│   │   ├── seeds/                ← Initial seed data
│   │   ├── services/             ← Business logic (auth, email, reports, …)
│   │   └── utils/                ← JWT, password, response helpers
│   └── client/                   ← React + Material UI frontend
│       └── src/
│           ├── components/       ← Reusable UI components
│           ├── pages/            ← Page-level components
│           ├── services/         ← API client
│           ├── store/            ← Auth context
│           └── i18n/             ← Internationalisation context
├── tests/
│   ├── unit/                     ← Jest unit tests (no DB required)
│   └── e2e/                      ← Playwright browser tests
├── .env.example                  ← Environment variable template
├── docker-compose.yml            ← Docker Compose stack
├── jest.config.js                ← Jest configuration
├── playwright.config.js          ← Playwright configuration
└── package.json                  ← Root package with npm scripts
```

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server with nodemon (auto-reload) |
| `npm run build` | Build the React frontend |
| `npm test` | Run unit tests (Jest) |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run lint` | Lint the server code with ESLint |
| `npm run migrate` | Run pending database migrations |
| `npm run seed` | Seed initial data (idempotent) |
| `npm run update` | Install deps + run migrations (safe update) |
| `npm run health-check` | HTTP health check against `localhost:3000/health` |

---

## Tech Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4
- **Database:** PostgreSQL 14/15/16
- **Migrations:** Knex.js
- **Auth:** JWT (access + refresh tokens), bcryptjs, TOTP (otplib)
- **Email:** Nodemailer ≥ 7.0.11
- **Security:** Helmet, CORS, express-rate-limit, express-validator

### Frontend
- **Framework:** React 18
- **UI Library:** Material UI (MUI) v5
- **Charts:** Recharts
- **Calendar:** FullCalendar
- **Forms:** React Hook Form + Yup
- **Routing:** React Router v6

### Testing
- **Unit tests:** Jest + supertest (no database required)
- **E2E tests:** Playwright (Chromium)
- **CI:** GitHub Actions

---

## Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Email | `admin@crm.local` |
| Password | `changeme` |

> **You will be forced to change the password on first login.**

---

## Default Roles

| Role | Summary |
|------|---------|
| **Admin** | Full access to everything |
| **Manager** | Full CRUD on business data; generate reports; view users |
| **Sales** | Create/edit contacts, companies, leads; manage calendar |
| **User** | Limited read/write on contacts and notes |
| **ReadOnly** | View-only access |

---

## API Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## License

[MIT](LICENSE)
