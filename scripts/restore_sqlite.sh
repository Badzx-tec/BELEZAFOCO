#!/usr/bin/env bash
set -euo pipefail
BACKUP_FILE=$1
TARGET_DB=${2:-apps/api/prisma/dev.db}
cp "$BACKUP_FILE" "$TARGET_DB"
echo "Restore concluído: $TARGET_DB"
