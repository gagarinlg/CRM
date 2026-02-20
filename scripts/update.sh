#!/bin/bash
# ────────────────────────────────────────────────────────────────────────────
# CRM Update Script
# Run as root or with sudo: sudo bash update.sh
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/crm}"
CRM_USER="${CRM_USER:-crm}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/crm}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"

echo "╔══════════════════════════════════════════╗"
echo "║       CRM System Updater                 ║"
echo "╚══════════════════════════════════════════╝"
echo

# ── Check root ───────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: This script must be run as root." >&2
  exit 1
fi

if [ ! -d "${INSTALL_DIR}" ]; then
  echo "ERROR: CRM installation not found at ${INSTALL_DIR}" >&2
  exit 1
fi

# ── Create backup before update ───────────────────────────────────────────────
echo "Creating backup before update..."
bash "$(dirname "$0")/backup.sh" || {
  echo "WARNING: Backup failed. Proceeding with update anyway."
}

# ── Stop service ─────────────────────────────────────────────────────────────
echo "Stopping CRM service..."
systemctl stop crm || true

# ── Pull latest code (if this is a git checkout) ──────────────────────────────
if [ -d "${INSTALL_DIR}/.git" ]; then
  echo "Pulling latest code..."
  cd "${INSTALL_DIR}"
  sudo -u "${CRM_USER}" git fetch origin
  sudo -u "${CRM_USER}" git pull --ff-only
fi

# ── Install/update dependencies ───────────────────────────────────────────────
echo "Installing dependencies..."
cd "${INSTALL_DIR}"
npm install --production --ignore-scripts

# ── Run migrations ────────────────────────────────────────────────────────────
echo "Running database migrations..."
sudo -u "${CRM_USER}" bash -c "
  set -o allexport
  source '${INSTALL_DIR}/.env'
  set +o allexport
  cd '${INSTALL_DIR}'
  npm run migrate
"

# ── Restart service ───────────────────────────────────────────────────────────
echo "Starting CRM service..."
systemctl start crm

# ── Health check ──────────────────────────────────────────────────────────────
sleep 3
PORT=$(grep '^PORT=' "${INSTALL_DIR}/.env" 2>/dev/null | cut -d= -f2 || echo 3000)
if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
  echo "✓ CRM is healthy at http://localhost:${PORT}"
else
  echo "WARNING: Health check failed. Check logs: journalctl -u crm -f"
fi

# ── Clean up old backups ──────────────────────────────────────────────────────
if [ -d "${BACKUP_DIR}" ]; then
  ls -t "${BACKUP_DIR}"/crm_backup_*.tar.gz 2>/dev/null | \
    tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f -- || true
fi

echo
echo "Update complete."
