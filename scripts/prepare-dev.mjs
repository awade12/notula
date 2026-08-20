import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { getRootDir, detectPackageManager, workspaceArgs } from './lib/pm.mjs'

const root = getRootDir()

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return values
}

function writeEnvFile(filePath, values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`)
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`)
}

function ensureRootEnv() {
  const envPath = path.join(root, '.env')
  const examplePath = path.join(root, '.env.example')

  if (fs.existsSync(envPath)) {
    return
  }

  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
    console.log('Created .env from .env.example')
    return
  }

  const legacyServerEnv = path.join(root, 'apps/server/.env')
  const legacyWebEnv = path.join(root, 'apps/web/.env')
  const merged = {
    ...parseEnvFile(legacyServerEnv),
    ...parseEnvFile(legacyWebEnv),
  }

  if (Object.keys(merged).length > 0) {
    writeEnvFile(envPath, merged)
    console.log('Migrated apps/server/.env and apps/web/.env into root .env')
  }
}

function readDatabaseUrl() {
  const envPath = path.join(root, '.env')
  const values = parseEnvFile(envPath)
  return values.DATABASE_URL ?? null
}

function usesLocalPostgres(databaseUrl) {
  if (!databaseUrl) return false
  try {
    const { hostname } = new URL(databaseUrl)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

function ensureLocalPostgres() {
  if (process.env.SKIP_DOCKER === '1') {
    return
  }

  const databaseUrl = readDatabaseUrl()
  if (!usesLocalPostgres(databaseUrl)) {
    return
  }

  console.log('Ensuring local Postgres is running (docker compose)...')
  const result = spawnSync('docker', ['compose', 'up', '-d', 'postgres'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    console.warn(
      'Could not start Docker Postgres. Set DATABASE_URL in root .env or run: docker compose up -d postgres',
    )
  }
}

function migrateDatabase() {
  console.log('Applying database migrations...')
  const packageManager = detectPackageManager()
  const { command, args } = workspaceArgs(packageManager, '@notesapp/server', 'db:migrate')
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    console.warn(
      'Database migration failed. Check DATABASE_URL in root .env and that Postgres is reachable.',
    )
    console.warn(
      'If the error is about the "vector" extension, pgvector is not installed on this Postgres host.',
    )
    console.warn(
      'Core app features still work without it (keyword search, AI settings). For semantic search use:',
    )
    console.warn('  • Local: bun run db:up  then set DATABASE_URL=postgresql://notesapp:notesapp@localhost:5432/notesapp')
    console.warn('  • Neon: https://neon.tech (pgvector included)')
  }
}

ensureRootEnv()
ensureLocalPostgres()
migrateDatabase()

console.log('Dev environment ready.')
