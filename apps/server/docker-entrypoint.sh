#!/bin/sh
set -eu

cd /app/apps/server

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[server] Running database migrations..."
  bun run db:migrate
  bun run db:migrate:pgvector || echo "[server] pgvector migration skipped or already applied"
fi

echo "[server] Validating environment..."
node --import tsx scripts/validate-env.ts

echo "[server] Starting HTTP server..."
exec node --import tsx src/index.ts
