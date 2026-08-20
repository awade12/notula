import { and, eq, ilike, or } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { pages } from '../../db/schema/pages'
import { semanticSearchPages } from '../ai/embeddings'
import { getUserAiConfig } from '../settings/service'
import { requireSpaceMembership } from '../spaces/permissions'
import { isPgvectorReady } from '../../lib/pgvector'

export type SearchMode = 'keyword' | 'semantic' | 'hybrid'

export type SearchScope = 'all' | 'notes' | 'folders'

function filterByScope<T extends { kind: string }>(rows: T[], scope?: SearchScope) {
  if (!scope || scope === 'all') return rows
  if (scope === 'notes') return rows.filter((row) => row.kind === 'note')
  return rows.filter((row) => row.kind === 'folder')
}

export type SearchMatchType = 'title' | 'keyword' | 'semantic'

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

function buildSnippet(plaintext: string, query: string) {
  const lower = plaintext.toLowerCase()
  const index = lower.indexOf(query.toLowerCase())
  if (index === -1) {
    return plaintext.slice(0, 120)
  }

  const start = Math.max(0, index - 40)
  const end = Math.min(plaintext.length, index + query.length + 80)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < plaintext.length ? '…' : ''
  return `${prefix}${plaintext.slice(start, end)}${suffix}`
}

type SearchResult = {
  id: string
  title: string
  icon: string | null
  kind: string
  updatedAt: Date
  snippet: string
  matchType: SearchMatchType
  score: number
}

function mergeHybridResults(
  keywordResults: SearchResult[],
  semanticResults: SearchResult[],
  limit: number,
) {
  const scores = new Map<string, number>()
  const byId = new Map<string, SearchResult>()

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

async function keywordSearch(
  db: Db,
  spaceId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const pattern = `%${escapeLikePattern(query)}%`

  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      plaintext: pages.plaintext,
      icon: pages.icon,
      kind: pages.kind,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(
      and(
        eq(pages.spaceId, spaceId),
        or(ilike(pages.title, pattern), ilike(pages.plaintext, pattern)),
      ),
    )
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    icon: row.icon,
    kind: row.kind,
    updatedAt: row.updatedAt,
    snippet: buildSnippet(row.plaintext, query),
    matchType: row.title.toLowerCase().includes(query.toLowerCase())
      ? ('title' as const)
      : ('keyword' as const),
    score: row.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5,
  }))
}

export async function searchPages(
  db: Db,
  spaceId: string,
  userId: string,
  query: string,
  options: {
    mode?: SearchMode
    limit?: number
    scope?: SearchScope
    authSecret: string
  },
) {
  await requireSpaceMembership(db, spaceId, userId)

  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const limit = options.limit ?? 30
  const mode = options.mode ?? 'keyword'
  const scope = options.scope ?? 'all'

  if (mode === 'keyword') {
    return filterByScope(await keywordSearch(db, spaceId, trimmed, limit), scope)
  }

  const aiConfig = await getUserAiConfig(db, userId, options.authSecret)
  const pgvector = await isPgvectorReady(db)
  const canSemantic =
    pgvector && aiConfig.enableEmbeddings && aiConfig.apiKey && trimmed.length >= 2

  if (mode === 'semantic') {
    if (!canSemantic || !aiConfig.apiKey) {
      return filterByScope(await keywordSearch(db, spaceId, trimmed, limit), scope)
    }

    const rows = await semanticSearchPages(db, spaceId, aiConfig.apiKey, trimmed, limit)
    return filterByScope(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        icon: row.icon,
        kind: row.kind,
        updatedAt: row.updatedAt,
        snippet: buildSnippet(row.plaintext, trimmed),
        matchType: 'semantic' as const,
        score: Number(row.score),
      })),
      scope,
    )
  }

  const keywordResults = await keywordSearch(db, spaceId, trimmed, limit)

  if (!canSemantic || !aiConfig.apiKey) {
    return filterByScope(keywordResults, scope)
  }

  const semanticRows = await semanticSearchPages(db, spaceId, aiConfig.apiKey, trimmed, limit)
  const semanticResults = semanticRows.map((row) => ({
    id: row.id,
    title: row.title,
    icon: row.icon,
    kind: row.kind,
    updatedAt: row.updatedAt,
    snippet: buildSnippet(row.plaintext, trimmed),
    matchType: 'semantic' as const,
    score: Number(row.score),
  }))

  return filterByScope(mergeHybridResults(keywordResults, semanticResults, limit), scope)
}
