#!/bin/sh
set -eu

cd /app/apps/server

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[server] Running database migrations..."
  bun run db:migrate
  bun run db:migrate:pgvector || echo "[server] pgvector migration skipped or already applied"
fi

echo "[server] Validating environment..."
node --import tsx -e "
import { loadEnv } from './src/env.ts'
const env = loadEnv()
console.log('[server] BETTER_AUTH_URL=' + env.BETTER_AUTH_URL)
console.log('[server] WEB_ORIGIN=' + env.WEB_ORIGIN)
console.log('[server] PORT=' + env.PORT)
"

echo "[server] Starting HTTP server..."
exec node --import tsx src/index.ts
