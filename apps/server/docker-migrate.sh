#!/bin/sh
set -eu

cd /app/apps/server

echo "[migrate] Starting database migrations..."

if [ -z "${DATABASE_URL:-}" ] && [ -z "${PGPASSWORD:-}" ]; then
  echo "[migrate] ERROR: Set DATABASE_URL or PGPASSWORD (with PGHOST/PGUSER/PGDATABASE)."
  exit 1
fi

echo "[migrate] Applying Drizzle migrations..."
../../node_modules/.bin/drizzle-kit migrate

echo "[migrate] Applying pgvector migration..."
node scripts/migrate-pgvector.mjs || true

echo "[migrate] Database migrations finished."
