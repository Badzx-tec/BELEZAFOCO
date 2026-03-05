#!/usr/bin/env bash
set -euo pipefail
DB_PATH=${1:-apps/api/prisma/dev.db}
BACKUP_DIR=${2:-backups}
mkdir -p "$BACKUP_DIR"
STAMP=$(date +"%Y%m%d-%H%M%S")
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/belezafoco-$STAMP.db'"
find "$BACKUP_DIR" -type f -name '*.db' -mtime +7 -delete
echo "Backup criado em $BACKUP_DIR/belezafoco-$STAMP.db"
