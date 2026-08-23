import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { applyDatabaseUrlFromEnv } from './apply-database-url.mjs'

applyDatabaseUrlFromEnv()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationPaths = [
  path.join(__dirname, '../src/db/migrations/0008_pgvector_embeddings.sql'),
  path.join(__dirname, '../src/db/migrations/0013_task_embeddings.sql'),
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()

  for (const migrationPath of migrationPaths) {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    const statements = sql
      .split('--> statement-breakpoint')
      .map((part) => part.trim())
      .filter(Boolean)

    for (const statement of statements) {
      await client.query(statement)
    }
  }

  console.log('pgvector migrations applied (page + task embeddings enabled).')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('pgvector migration failed:', message)
  process.exit(1)
} finally {
  await client.end()
}
