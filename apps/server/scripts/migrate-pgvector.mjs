import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { applyDatabaseUrlFromEnv } from './apply-database-url.mjs'

applyDatabaseUrlFromEnv()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationPath = path.join(__dirname, '../src/db/migrations/0008_pgvector_embeddings.sql')

const sql = fs.readFileSync(migrationPath, 'utf8')
const statements = sql
  .split('--> statement-breakpoint')
  .map((part) => part.trim())
  .filter(Boolean)

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()

  for (const statement of statements) {
    await client.query(statement)
  }

  console.log('pgvector migration applied (semantic search enabled).')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('pgvector migration failed:', message)
  process.exit(1)
} finally {
  await client.end()
}
