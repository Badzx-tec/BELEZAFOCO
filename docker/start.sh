#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  echo "[INFO] Running prisma migrate deploy before startup..."
  cd /app
  pnpm --filter @belezafoco/api exec prisma migrate deploy --schema prisma/schema.prisma
fi

exec node apps/api/dist/src/server.js
