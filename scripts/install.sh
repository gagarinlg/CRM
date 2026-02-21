#!/bin/bash
# ────────────────────────────────────────────────────────────────────────────
# CRM Installation Script for Ubuntu 22.04 / 24.04
# Run as root or with sudo: sudo bash install.sh
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/crm}"
CRM_USER="${CRM_USER:-crm}"
DB_NAME="${DB_NAME:-crm_db}"
DB_USER="${DB_USER:-crm_user}"
PORT="${PORT:-3000}"
APP_VERSION="${APP_VERSION:-1.0.0}"

# ── Resolve DB_PASSWORD BEFORE touching PostgreSQL ───────────────────────────
# Priority: existing installation .env > source-tree .env > generated random.
# This ensures the password used to create/alter the DB role always matches
# the password that migrations (and the running app) will use.
_resolve_password() {
  local file="$1"
  [ -f "$file" ] || return
  grep -E '^DB_PASSWORD=' "$file" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}
DB_PASSWORD=""
# 1. Re-run: honour the password from an existing installation
[ -z "$DB_PASSWORD" ] && DB_PASSWORD="$(_resolve_password "${INSTALL_DIR}/.env")"
# 2. User pre-configured .env (e.g. copied from .env.example and edited)
[ -z "$DB_PASSWORD" ] && DB_PASSWORD="$(_resolve_password ".env")"
# 3. Nothing found – generate a fresh random password
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"

echo "╔══════════════════════════════════════════╗"
echo "║       CRM System Installer               ║"
echo "╚══════════════════════════════════════════╝"
echo

# ── Check root ───────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: This script must be run as root." >&2
  exit 1
fi

# ── Install system packages ───────────────────────────────────────────────────
echo "Installing system dependencies..."
apt-get update -q
apt-get install -y -q curl gnupg postgresql postgresql-contrib

# ── Install Node.js 20 LTS ────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node --version | cut -d. -f1)" < "v20" ]]; then
  echo "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -q nodejs
fi
echo "Node.js $(node --version) is installed."

# ── Configure PostgreSQL ──────────────────────────────────────────────────────
echo "Configuring PostgreSQL..."
systemctl enable --now postgresql

sudo -u postgres psql <<SQL
  -- Create user if it does not exist, then always sync the password so that
  -- it matches whatever is in .env (handles re-runs and fresh installs alike).
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    ELSE
      ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
  END \$\$;
  SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec
  GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# ── Create system user ────────────────────────────────────────────────────────
id "${CRM_USER}" &>/dev/null || useradd --system --home "${INSTALL_DIR}" --shell /sbin/nologin "${CRM_USER}"

# ── Install application ───────────────────────────────────────────────────────
echo "Installing application to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"
cp -r . "${INSTALL_DIR}/"
cd "${INSTALL_DIR}"

echo "Installing dependencies..."
npm install --ignore-scripts

echo "Building frontend..."
npm run build

# ── Write .env ────────────────────────────────────────────────────────────────
JWT_SECRET="$(openssl rand -hex 48)"
JWT_REFRESH_SECRET="$(openssl rand -hex 48)"
# Detect the primary outbound IP so FRONTEND_URL and CORS work out of the box
# when the server is accessed by its real IP instead of "localhost".
SERVER_IP="$(hostname -I | awk '{print $1}')"

if [ ! -f "${INSTALL_DIR}/.env" ]; then
  cat > "${INSTALL_DIR}/.env" <<ENV
NODE_ENV=production
PORT=${PORT}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD="${DB_PASSWORD}"
DB_SSL=false
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
# FRONTEND_URL is the canonical URL used in emails and as the primary CORS origin.
# When the frontend is served by this same Express server (default), use the
# server's own address. Change to your domain name once DNS is configured.
FRONTEND_URL=http://${SERVER_IP}:${PORT}
# CORS_ORIGINS: comma-separated extra origins allowed to call the API.
# Add your domain here if you put the app behind a reverse proxy, e.g.:
# CORS_ORIGINS=https://crm.example.com,http://crm.example.com
CORS_ORIGINS=
APP_VERSION=${APP_VERSION}
ENV
  chmod 600 "${INSTALL_DIR}/.env"
  echo "Created ${INSTALL_DIR}/.env — review and customise it."
else
  echo "Existing ${INSTALL_DIR}/.env found — keeping it."
fi

chown -R "${CRM_USER}:${CRM_USER}" "${INSTALL_DIR}"

# ── Run migrations ────────────────────────────────────────────────────────────
echo "Running database migrations..."
# Source .env inside the subshell so DB_PASSWORD is available to dotenv/pg
# even though sudo strips environment variables by default.
sudo -u "${CRM_USER}" bash -c "
  set -o allexport
  source '${INSTALL_DIR}/.env'
  set +o allexport
  cd '${INSTALL_DIR}'
  npm run migrate
"
echo "Running database seed (initial data)..."
sudo -u "${CRM_USER}" bash -c "
  set -o allexport
  source '${INSTALL_DIR}/.env'
  set +o allexport
  cd '${INSTALL_DIR}'
  npm run seed
" || true

# ── Install systemd service ───────────────────────────────────────────────────
cat > /etc/systemd/system/crm.service <<SYSTEMD
[Unit]
Description=CRM System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${CRM_USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/node src/server/index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=${INSTALL_DIR}/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable crm
systemctl start crm

echo
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CRM installed successfully!                             ║"
echo "║                                                          ║"
echo "║  Service: systemctl {start|stop|restart|status} crm     ║"
echo "║  Logs:    journalctl -u crm -f                           ║"
echo "║  URL:     http://$(hostname -I | awk '{print $1}'):${PORT}            ║"
echo "║                                                          ║"
echo "║  Default login:  admin / changeme                        ║"
echo "║  (admin@crm.local — password change required on login)  ║"
echo "╚══════════════════════════════════════════════════════════╝"
