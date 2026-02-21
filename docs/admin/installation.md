# CRM System — Installation Guide

> **Audience:** System administrators installing CRM on a fresh Ubuntu server.  
> **Supported OS:** Ubuntu 22.04 LTS and Ubuntu 24.04 LTS (64-bit).

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Quick Install (Automated)](#2-quick-install-automated)
3. [Manual Installation](#3-manual-installation)
   - 3.1 [Install System Packages](#31-install-system-packages)
   - 3.2 [Install Node.js 20 LTS](#32-install-nodejs-20-lts)
   - 3.3 [Set Up PostgreSQL](#33-set-up-postgresql)
   - 3.4 [Download the Application](#34-download-the-application)
   - 3.5 [Configure Environment Variables](#35-configure-environment-variables)
   - 3.6 [Install Dependencies & Initialise Database](#36-install-dependencies--initialise-database)
   - 3.7 [Register as a systemd Service](#37-register-as-a-systemd-service)
4. [Docker / Docker Compose](#4-docker--docker-compose)
5. [SSL / TLS Configuration](#5-ssl--tls-configuration)
6. [Firewall Configuration](#6-firewall-configuration)
7. [First Login](#7-first-login)
8. [Verify the Installation](#8-verify-the-installation)
9. [Updating the Application](#9-updating-the-application)
10. [Backup & Restore](#10-backup--restore)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Node.js | 20.x LTS | 20.x LTS (latest) |
| PostgreSQL | 14 | 15 or 16 |
| Outbound port | 587 or 465 | (for email sending) |

---

## 2. Quick Install (Automated)

The fastest way to install on a fresh Ubuntu server is with the included install script. It handles all steps automatically.

```bash
# Download the latest release archive, extract it, then run:
sudo bash scripts/install.sh
```

The script will:
- Install Node.js 20, PostgreSQL, and required system packages
- Create the `crm` system user
- Create the PostgreSQL database and user
- Write `/opt/crm/.env` with secure random secrets
- Run all database migrations and seed initial data
- Register and start a `systemd` service named `crm`

After it completes, open your browser at `http://<server-ip>:3000` and log in with `admin` / `changeme`.

> **Note:** You will be forced to change the password on first login.

---

## 3. Manual Installation

### 3.1 Install System Packages

```bash
sudo apt-get update
sudo apt-get install -y curl gnupg ca-certificates
```

### 3.2 Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should show v20.x.x
```

### 3.3 Set Up PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create the database user and database:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER crm_user WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE crm_db OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
SQL
```

> **Security tip:** Replace `choose-a-strong-password` with a long random string.  
> Store it securely — you will need it in `.env`.

### 3.4 Download the Application

**From a release archive:**

```bash
wget https://github.com/gagarinlg/CRM/releases/latest/download/crm-1.0.0.tar.gz
tar -xzf crm-1.0.0.tar.gz
sudo mv crm-1.0.0 /opt/crm
```

**From git (development / latest):**

```bash
git clone https://github.com/gagarinlg/CRM.git /opt/crm
```

Create the system user:

```bash
sudo useradd --system --home /opt/crm --shell /sbin/nologin crm
```

### 3.5 Configure Environment Variables

```bash
sudo cp /opt/crm/.env.example /opt/crm/.env
sudo nano /opt/crm/.env
```

Minimum required settings:

```dotenv
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=crm_user
DB_PASSWORD=<your-db-password>

# JWT — generate with: openssl rand -base64 48
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URL the frontend is served from
FRONTEND_URL=https://crm.yourdomain.com
```

Secure the file so only root and the `crm` user can read it:

```bash
sudo chown root:crm /opt/crm/.env
sudo chmod 640 /opt/crm/.env
```

#### Email (SMTP) settings

Add these to `.env` to enable outgoing email (reminders, notifications):

```dotenv
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<smtp-password>
SMTP_FROM="CRM System <noreply@yourdomain.com>"
```

You can also configure SMTP through the Admin UI after first login  
(**Admin → Settings → Email/SMTP**).

### 3.6 Install Dependencies & Initialise Database

```bash
cd /opt/crm
sudo -u crm npm install --production --ignore-scripts
sudo -u crm npm run migrate   # creates all tables
sudo -u crm npm run seed      # inserts default data (admin user, roles, etc.)
sudo chown -R crm:crm /opt/crm
```

### 3.7 Register as a systemd Service

Create the unit file:

```bash
sudo tee /etc/systemd/system/crm.service > /dev/null <<'UNIT'
[Unit]
Description=CRM System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=crm
WorkingDirectory=/opt/crm
ExecStart=/usr/bin/node src/server/index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/opt/crm/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable crm
sudo systemctl start crm
sudo systemctl status crm
```

Tail logs in real time:

```bash
journalctl -u crm -f
```

---

## 4. Docker / Docker Compose

A `docker-compose.yml` is included that spins up the app, PostgreSQL 15, and Redis with a single command.

```bash
# Copy and edit environment file
cp .env.example .env
nano .env          # at minimum, set JWT_SECRET and JWT_REFRESH_SECRET

# Build and start
docker compose up -d

# Run migrations & seed (first time only)
docker compose exec app npm run migrate
docker compose exec app npm run seed
```

The application will be available at `http://localhost:3000`.

To stop:

```bash
docker compose down
```

To stop and remove volumes (destructive — deletes all data):

```bash
docker compose down -v
```

---

## 5. SSL / TLS Configuration

The CRM application does **not** terminate TLS itself. Use a reverse proxy such as **Nginx** or **Caddy**.

### Nginx with Let's Encrypt (certbot)

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/crm`:

```nginx
server {
    listen 80;
    server_name crm.yourdomain.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain TLS certificate
sudo certbot --nginx -d crm.yourdomain.com
```

Certbot will automatically modify the Nginx config to enable HTTPS and set up auto-renewal.

After enabling HTTPS, update `.env`:

```dotenv
FRONTEND_URL=https://crm.yourdomain.com
```

Restart the CRM service: `sudo systemctl restart crm`

---

## 6. Firewall Configuration

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # ports 80 and 443
sudo ufw enable
sudo ufw status
```

> Do **not** expose port 3000 (the Node.js port) directly to the internet if you are using a reverse proxy.

If you are **not** using Nginx:

```bash
sudo ufw allow 3000/tcp
```

---

## 7. First Login

1. Open `http://<server-ip>:3000` (or your domain if SSL is configured).
2. Log in with username `admin` and password `changeme`.
3. You will immediately be redirected to change your password. Choose a strong password (minimum 8 characters, upper + lower + number).
4. After changing your password, you will be taken to the dashboard.
5. Configure SMTP settings (**Admin → Settings → Email/SMTP**) if you want email notifications.

---

## 8. Verify the Installation

Check the health endpoint:

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0","uptime":...}
```

Run the built-in health check script:

```bash
npm run health-check
```

Check the service status:

```bash
sudo systemctl status crm
journalctl -u crm --since "5 minutes ago"
```

---

## 9. Updating the Application

### Using the update script (recommended)

```bash
sudo bash /opt/crm/scripts/update.sh
```

The script will:
1. Create a backup automatically
2. Stop the service
3. Pull the latest code (if installed via git) or install new packages
4. Run any pending database migrations
5. Restart the service and run a health check

### Manual update

```bash
# Stop service
sudo systemctl stop crm

# Pull new code (git install)
cd /opt/crm && sudo -u crm git pull

# Or extract new release archive
# sudo tar -xzf crm-x.y.z.tar.gz --strip-components=1 -C /opt/crm

# Install/update dependencies
sudo -u crm npm install --production --ignore-scripts

# Run migrations
sudo -u crm npm run migrate

# Restart
sudo systemctl start crm
sudo systemctl status crm
```

---

## 10. Backup & Restore

### Creating a backup

```bash
sudo bash /opt/crm/scripts/backup.sh
```

Backups are stored in `/var/backups/crm/` as timestamped archives (`crm_backup_YYYYMMDD_HHMMSS.tar.gz`). Each archive contains the PostgreSQL database dump and the `.env` configuration file.

The script keeps the 7 most recent backups by default (configurable via `KEEP_BACKUPS` environment variable).

### Scheduling automatic backups (cron)

```bash
sudo crontab -e
# Add this line to run a backup every day at 03:00:
0 3 * * * /opt/crm/scripts/backup.sh >> /var/log/crm-backup.log 2>&1
```

### Restoring from a backup

```bash
BACKUP=/var/backups/crm/crm_backup_20240101_030000.tar.gz

# Extract archive
cd /tmp && tar -xzf "$BACKUP"

# Restore database
PGPASSWORD=<db-password> pg_restore \
  -h localhost -U crm_user -d crm_db \
  --clean --if-exists \
  /tmp/crm_backup_20240101_030000/database.pgdump

# Restore configuration (if needed)
sudo cp /tmp/crm_backup_20240101_030000/.env /opt/crm/.env

# Restart service
sudo systemctl restart crm
```

---

## 11. Troubleshooting

### Service fails to start

```bash
journalctl -u crm -n 50 --no-pager
```

Common causes:
- **`Error: connect ECONNREFUSED`** — PostgreSQL is not running.  
  Fix: `sudo systemctl start postgresql`
- **`Error: JWT_SECRET is not defined`** — `.env` file is missing or unreadable.  
  Fix: check `/opt/crm/.env` exists and has the correct `JWT_SECRET`.
- **`Error: EACCES: permission denied`** — File permissions issue.  
  Fix: `sudo chown -R crm:crm /opt/crm`

### Cannot connect to the database

```bash
# Test connection manually
PGPASSWORD=<db-password> psql -h localhost -U crm_user -d crm_db -c '\l'
```

### Port already in use

```bash
sudo lsof -i :3000
# Kill conflicting process or change PORT in .env
```

### Migrations fail

```bash
cd /opt/crm && sudo -u crm npm run migrate -- --debug
```

Check that the `crm_user` PostgreSQL role has the `CREATE` privilege on the database.

### Application returns 500 errors

View recent application logs:

```bash
journalctl -u crm -n 100 --no-pager
```

Set `LOG_LEVEL=debug` in `.env` and restart for more verbose output.

### Resetting the admin password

```bash
sudo -u crm node -e "
const { hashPassword } = require('./src/server/utils/password');
const knex = require('knex')(require('./src/server/config/knexfile').production);
hashPassword('NewPassword1').then(hash =>
  knex('users').where({ username: 'admin' }).update({ password_hash: hash, force_password_change: true })
).then(() => { console.log('Done'); knex.destroy(); });
"
```
