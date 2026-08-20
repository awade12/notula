#!/bin/sh
set -e

cd /app/apps/server

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running database migrations..."
  bun run db:migrate
  bun run db:migrate:pgvector || echo "pgvector migration skipped or already applied"
fi

exec node --import tsx src/index.ts
