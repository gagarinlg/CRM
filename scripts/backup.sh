#!/bin/bash
# ────────────────────────────────────────────────────────────────────────────
# CRM Backup Script
# Creates a timestamped backup of the database and uploaded files.
# Can be run manually or scheduled via cron:
#   0 3 * * * /opt/crm/scripts/backup.sh >> /var/log/crm-backup.log 2>&1
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/crm}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/crm}"
KEEP_BACKUPS="${KEEP_BACKUPS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="crm_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Load environment variables
if [ -f "${INSTALL_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  set -o allexport
  source "${INSTALL_DIR}/.env"
  set +o allexport
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-crm_db}"
DB_USER="${DB_USER:-crm_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo "[$(date)] Starting CRM backup..."

mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_PATH}"

# ── Database backup ───────────────────────────────────────────────────────────
echo "[$(date)] Backing up database ${DB_NAME}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --no-acl \
  --no-owner \
  -f "${BACKUP_PATH}/database.pgdump" 2>/dev/null || {
    echo "[$(date)] WARNING: pg_dump failed — is PostgreSQL running?" >&2
  }

# ── Application config backup ─────────────────────────────────────────────────
echo "[$(date)] Backing up configuration..."
[ -f "${INSTALL_DIR}/.env" ] && cp "${INSTALL_DIR}/.env" "${BACKUP_PATH}/.env"

# ── Create compressed archive ─────────────────────────────────────────────────
echo "[$(date)] Creating archive..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

ARCHIVE_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz (${ARCHIVE_SIZE})"

# ── Rotate old backups ────────────────────────────────────────────────────────
echo "[$(date)] Removing backups older than ${KEEP_BACKUPS} copies..."
ls -t "${BACKUP_DIR}"/crm_backup_*.tar.gz 2>/dev/null | \
  tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f -- || true

echo "[$(date)] Backup complete. To restore:"
echo "  pg_restore -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
