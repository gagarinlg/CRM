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
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"
PORT="${PORT:-3000}"
APP_VERSION="${APP_VERSION:-1.0.0}"

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
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
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

npm install --production --ignore-scripts

# ── Write .env ────────────────────────────────────────────────────────────────
JWT_SECRET="$(openssl rand -hex 48)"
JWT_REFRESH_SECRET="$(openssl rand -hex 48)"

if [ ! -f "${INSTALL_DIR}/.env" ]; then
  cat > "${INSTALL_DIR}/.env" <<ENV
NODE_ENV=production
PORT=${PORT}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD="${DB_PASSWORD}"
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:${PORT}
APP_VERSION=${APP_VERSION}
ENV
  chmod 600 "${INSTALL_DIR}/.env"
  echo "Created ${INSTALL_DIR}/.env — review and customise it."
fi

chown -R "${CRM_USER}:${CRM_USER}" "${INSTALL_DIR}"

# ── Run migrations ────────────────────────────────────────────────────────────
echo "Running database migrations..."
sudo -u "${CRM_USER}" bash -c "cd '${INSTALL_DIR}' && npm run migrate"
echo "Running database seed (initial data)..."
sudo -u "${CRM_USER}" bash -c "cd '${INSTALL_DIR}' && npm run seed" || true

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
