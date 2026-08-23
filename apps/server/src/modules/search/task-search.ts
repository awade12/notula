import { and, eq, or, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databaseRows, databases } from '../../db/schema/databases'
import { semanticSearchTasks } from '../ai/embeddings'
import { resolveSearchEmbeddingApiKey } from '../ai/resolve-search-embedding-api-key'
import { extractRetrievalTerms } from '../ai/retrieval-query'
import { isPgvectorReady } from '../../lib/pgvector'
type SearchMatchType = 'title' | 'keyword' | 'semantic'

export type ProjectTaskSearchHit = {
  id: string
  boardId: string
  boardTitle: string
  title: string
  snippet: string
  matchType: SearchMatchType
  updatedAt: Date
  score: number
}

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export function readTaskTitle(properties: Record<string, unknown>) {
  const title = properties.title
  return typeof title === 'string' ? title : 'Untitled'
}

function readInlineText(content: unknown) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((item) => {
      if (typeof item !== 'object' || item === null) return ''
      return 'text' in item && typeof item.text === 'string' ? item.text : ''
    })
    .join('')
}

function readBlockText(block: unknown): string {
  if (typeof block !== 'object' || block === null) return ''

  const record = block as { content?: unknown; children?: unknown[] }
  const ownText = readInlineText(record.content)
  const childText =
    record.children
      ?.map((child) => readBlockText(child))
      .filter(Boolean)
      .join('\n') ?? ''

  return [ownText, childText].filter(Boolean).join('\n')
}

export function readTaskDescriptionText(properties: Record<string, unknown>) {
  const description = properties.description
  if (typeof description !== 'string' || !description.trim()) return ''

  if (description.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(description)
      if (Array.isArray(parsed)) {
        return parsed
          .map((block) => readBlockText(block))
          .filter(Boolean)
          .join('\n\n')
          .trim()
      }
    } catch {
      return description.trim()
    }
  }

  return description.trim()
}

export function readTaskDescriptionSnippet(properties: Record<string, unknown>, maxLength = 240) {
  return readTaskDescriptionText(properties).slice(0, maxLength)
}

function mapTaskSearchRow(
  row: {
    id: string
    boardId: string
    properties: Record<string, unknown>
    boardTitle: string
    updatedAt: Date
  },
  query: string,
  matchType: SearchMatchType = 'keyword',
  score = 0.5,
): ProjectTaskSearchHit {
  const title = readTaskTitle(row.properties)
  const description = readTaskDescriptionSnippet(row.properties)
  const normalizedQuery = query.toLowerCase()
  const resolvedMatchType = title.toLowerCase().includes(normalizedQuery) ? 'title' : matchType

  return {
    id: row.id,
    boardId: row.boardId,
    boardTitle: row.boardTitle,
    title,
    snippet: description || title,
    matchType: resolvedMatchType,
    updatedAt: row.updatedAt,
    score: resolvedMatchType === 'title' ? Math.max(score, 1) : score,
  }
}

async function keywordSearchProjectTasks(
  db: Db,
  spaceId: string,
  query: string,
  limit: number,
  excludeTaskId?: string,
): Promise<ProjectTaskSearchHit[]> {
  const terms = extractRetrievalTerms(query)
  const searchTerms = terms.length > 0 ? terms : [query.trim()].filter(Boolean)
  if (searchTerms.length === 0) return []

  const termClauses = searchTerms.flatMap((term) => {
    const pattern = `%${escapeLikePattern(term)}%`
    return [
      sql`${databaseRows.properties} ->> 'title' ILIKE ${pattern}`,
      sql`${databaseRows.properties} ->> 'description' ILIKE ${pattern}`,
    ]
  })

  const rows = await db
    .select({
      id: databaseRows.id,
      boardId: databaseRows.databaseId,
      properties: databaseRows.properties,
      boardTitle: databases.title,
      updatedAt: databaseRows.updatedAt,
    })
    .from(databaseRows)
    .innerJoin(databases, eq(databaseRows.databaseId, databases.id))
    .where(
      and(
        eq(databaseRows.spaceId, spaceId),
        eq(databases.isProjectBoard, true),
        or(...termClauses),
      ),
    )
    .limit(limit + (excludeTaskId ? 1 : 0))

  return rows
    .filter((row) => row.id !== excludeTaskId)
    .slice(0, limit)
    .map((row) => mapTaskSearchRow(row, query))
}

function mergeHybridTaskResults(
  keywordResults: ProjectTaskSearchHit[],
  semanticResults: ProjectTaskSearchHit[],
  limit: number,
) {
  const scores = new Map<string, number>()
  const byId = new Map<string, ProjectTaskSearchHit>()

  for (const [index, result] of keywordResults.entries()) {
    const rank = index + 1
    scores.set(result.id, (scores.get(result.id) ?? 0) + 1 / (60 + rank))
    byId.set(result.id, result)
  }

  for (const [index, result] of semanticResults.entries()) {
    const rank = index + 1
    scores.set(result.id, (scores.get(result.id) ?? 0) + 1 / (60 + rank))
    const existing = byId.get(result.id)
    byId.set(
      result.id,
      existing
        ? { ...existing, matchType: 'semantic', score: Math.max(existing.score, result.score) }
        : result,
    )
  }

  return [...byId.values()]
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
    .slice(0, limit)
}

export async function searchProjectTasks(
  db: Db,
  spaceId: string,
  userId: string,
  query: string,
  options: {
    mode?: 'keyword' | 'semantic' | 'hybrid'
    limit?: number
    authSecret: string
    excludeTaskId?: string
  },
): Promise<ProjectTaskSearchHit[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const limit = options.limit ?? 12
  const mode = options.mode ?? 'hybrid'
  const keywordResults = await keywordSearchProjectTasks(
    db,
    spaceId,
    trimmed,
    limit,
    options.excludeTaskId,
  )

  if (mode === 'keyword') {
    return keywordResults
  }

  const embeddingApiKey = await resolveSearchEmbeddingApiKey(
    db,
    spaceId,
    userId,
    options.authSecret,
  )
  const pgvector = await isPgvectorReady(db)
  const canSemantic = pgvector && embeddingApiKey && trimmed.length >= 2

  if (mode === 'semantic') {
    if (!canSemantic || !embeddingApiKey) return keywordResults

    const semanticRows = await semanticSearchTasks(db, spaceId, embeddingApiKey, trimmed, limit)
    return semanticRows
      .filter((row) => row.id !== options.excludeTaskId)
      .map((row) =>
        mapTaskSearchRow(
          {
            id: row.id,
            boardId: row.boardId,
            properties: row.properties,
            boardTitle: row.boardTitle,
            updatedAt: new Date(),
          },
          trimmed,
          'semantic',
          Number(row.score),
        ),
      )
  }

  if (!canSemantic || !embeddingApiKey) {
    return keywordResults
  }

  const semanticRows = await semanticSearchTasks(db, spaceId, embeddingApiKey, trimmed, limit)
  const semanticResults = semanticRows
    .filter((row) => row.id !== options.excludeTaskId)
    .map((row) =>
      mapTaskSearchRow(
        {
          id: row.id,
          boardId: row.boardId,
          properties: row.properties,
          boardTitle: row.boardTitle,
          updatedAt: new Date(),
        },
        trimmed,
        'semantic',
        Number(row.score),
      ),
    )

  return mergeHybridTaskResults(keywordResults, semanticResults, limit)
}

export function toRetrievedTask(hit: ProjectTaskSearchHit) {
  return {
    id: hit.id,
    boardId: hit.boardId,
    title: hit.title,
    boardTitle: hit.boardTitle,
    snippet: hit.snippet,
  }
}
