import { and, eq, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { embeddingLiteral, pages } from '../../db/schema/pages'
import { createEmbedding } from './openrouter'

export async function indexPageEmbedding(
  db: Db,
  pageId: string,
  apiKey: string,
  title: string,
  plaintext: string,
) {
  const content = `${title}\n\n${plaintext}`.trim()
  if (!content) return

  const embedding = await createEmbedding(apiKey, content.slice(0, 8000))
  const vector = embeddingLiteral(embedding)

  await db.execute(sql`
    UPDATE pages
    SET embedding = ${vector}, updated_at = NOW()
    WHERE id = ${pageId}
  `)
}

type SemanticRow = {
  id: string
  title: string
  plaintext: string
  icon: string | null
  kind: string
  updatedAt: Date
  score: number
}

export async function findSimilarPagesByEmbedding(
  db: Db,
  spaceId: string,
  pageId: string,
  limit: number,
  minScore: number,
) {
  const [pageRow] = await db
    .select({ embedding: pages.embedding })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!pageRow?.embedding || pageRow.embedding.length === 0) {
    return []
  }

  const vector = embeddingLiteral(pageRow.embedding)

  const result = await db.execute(sql`
    SELECT
      id,
      title,
      icon,
      1 - (embedding <=> ${vector}) as score
    FROM pages
    WHERE space_id = ${spaceId}
      AND id != ${pageId}
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${vector}) >= ${minScore}
    ORDER BY embedding <=> ${vector}
    LIMIT ${limit}
  `)

  return result.rows as Array<{
    id: string
    title: string
    icon: string | null
    score: number
  }>
}

export async function semanticSearchPages(
  db: Db,
  spaceId: string,
  apiKey: string,
  query: string,
  limit: number,
) {
  const queryEmbedding = await createEmbedding(apiKey, query)
  const vector = embeddingLiteral(queryEmbedding)

  const result = await db.execute(sql`
    SELECT
      id,
      title,
      plaintext,
      icon,
      kind,
      updated_at as "updatedAt",
      1 - (embedding <=> ${vector}) as score
    FROM pages
    WHERE space_id = ${spaceId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}
    LIMIT ${limit}
  `)

  return result.rows as SemanticRow[]
}
