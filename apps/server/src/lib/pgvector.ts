import { sql } from 'drizzle-orm'
import type { Db } from '../db/client'

let pgvectorReady: boolean | null = null

export async function isPgvectorReady(db: Db) {
  if (pgvectorReady !== null) return pgvectorReady

  try {
    const extension = await db.execute(
      sql`SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1`,
    )
    const column = await db.execute(
      sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pages' AND column_name = 'embedding' LIMIT 1`,
    )
    pgvectorReady = extension.rows.length > 0 && column.rows.length > 0
  } catch {
    pgvectorReady = false
  }

  return pgvectorReady
}
