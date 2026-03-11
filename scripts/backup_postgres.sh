#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${1:-}"
OUTPUT_DIR="${2:-./backups}"

if [[ -z "$DATABASE_URL" ]]; then
  echo "Uso: ./scripts/backup_postgres.sh <DATABASE_URL> [OUTPUT_DIR]"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILE_PATH="$OUTPUT_DIR/belezafoco-$TIMESTAMP.dump"

pg_dump "$DATABASE_URL" --clean --if-exists --format=custom --file="$FILE_PATH"
echo "Backup gerado em $FILE_PATH"
