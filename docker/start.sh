#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS_ON_START:-false}" = "true" ]; then
  echo "[INFO] Running prisma migrate deploy before startup..."
  cd /app
  pnpm --filter @belezafoco/api prisma:migrate:deploy
fi

exec node apps/api/dist/src/server.js
