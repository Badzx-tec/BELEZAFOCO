#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
DATABASE_URL="${2:-}"

if [[ -z "$BACKUP_FILE" || -z "$DATABASE_URL" ]]; then
  echo "Uso: ./scripts/restore_postgres.sh <BACKUP_FILE> <DATABASE_URL>"
  exit 1
fi

pg_restore --clean --if-exists --dbname="$DATABASE_URL" "$BACKUP_FILE"
echo "Restore concluído"
