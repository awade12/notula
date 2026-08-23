import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { pages } from '../../db/schema/pages'
import { semanticSearchPages } from '../ai/embeddings'
import { resolveSearchEmbeddingApiKey } from '../ai/resolve-search-embedding-api-key'
import { requireSpaceMembership } from '../spaces/permissions'
import { isPgvectorReady } from '../../lib/pgvector'
import { searchProjectTasks } from './task-search'

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

async function keywordSearchWithIlike(
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

async function keywordSearch(
  db: Db,
  spaceId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  try {
    const rows = await db
      .select({
        id: pages.id,
        title: pages.title,
        plaintext: pages.plaintext,
        icon: pages.icon,
        kind: pages.kind,
        updatedAt: pages.updatedAt,
        rank: sql<number>`ts_rank("pages"."search_vector", plainto_tsquery('english', ${query}))`,
      })
      .from(pages)
      .where(
        and(
          eq(pages.spaceId, spaceId),
          sql`"pages"."search_vector" @@ plainto_tsquery('english', ${query})`,
        ),
      )
      .orderBy(sql`ts_rank("pages"."search_vector", plainto_tsquery('english', ${query})) DESC`)
      .limit(limit)

    if (rows.length > 0) {
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
        score: Number(row.rank) || 0.5,
      }))
    }
  } catch {
    // Fall back when search_vector is unavailable.
  }

  return keywordSearchWithIlike(db, spaceId, query, limit)
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

  const embeddingApiKey = await resolveSearchEmbeddingApiKey(
    db,
    spaceId,
    userId,
    options.authSecret,
  )
  const pgvector = await isPgvectorReady(db)
  const canSemantic = pgvector && embeddingApiKey && trimmed.length >= 2

  if (mode === 'semantic') {
    if (!canSemantic || !embeddingApiKey) {
      return filterByScope(await keywordSearch(db, spaceId, trimmed, limit), scope)
    }

    const rows = await semanticSearchPages(db, spaceId, embeddingApiKey, trimmed, limit)
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

  if (!canSemantic || !embeddingApiKey) {
    return filterByScope(keywordResults, scope)
  }

  const semanticRows = await semanticSearchPages(db, spaceId, embeddingApiKey, trimmed, limit)
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

export type WorkspaceSearchPageResult = {
  resultType: 'page'
  id: string
  title: string
  icon: string | null
  kind: string
  snippet: string
  matchType: SearchMatchType
  updatedAt: Date
  score: number
}

export type WorkspaceSearchTaskResult = {
  resultType: 'task'
  id: string
  boardId: string
  boardTitle: string
  title: string
  snippet: string
  matchType: SearchMatchType
  updatedAt: Date
  score: number
}

export type WorkspaceSearchResult = WorkspaceSearchPageResult | WorkspaceSearchTaskResult

function mergeWorkspaceResults(
  pageResults: WorkspaceSearchPageResult[],
  taskResults: WorkspaceSearchTaskResult[],
  limit: number,
): WorkspaceSearchResult[] {
  const scores = new Map<string, number>()
  const byKey = new Map<string, WorkspaceSearchResult>()

  for (const [index, result] of pageResults.entries()) {
    const key = `page:${result.id}`
    const rank = index + 1
    scores.set(key, (scores.get(key) ?? 0) + 1 / (60 + rank))
    byKey.set(key, result)
  }

  for (const [index, result] of taskResults.entries()) {
    const key = `task:${result.id}`
    const rank = index + 1
    scores.set(key, (scores.get(key) ?? 0) + 1 / (60 + rank))
    byKey.set(key, result)
  }

  return [...byKey.entries()]
    .sort((a, b) => (scores.get(b[0]) ?? 0) - (scores.get(a[0]) ?? 0))
    .map(([, result]) => result)
    .slice(0, limit)
}

export async function searchWorkspace(
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
): Promise<WorkspaceSearchResult[]> {
  await requireSpaceMembership(db, spaceId, userId)

  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const limit = options.limit ?? 30
  const scope = options.scope ?? 'all'
  const includeTasks = scope === 'all'
  const pageLimit = includeTasks ? Math.max(8, Math.ceil(limit * 0.65)) : limit
  const taskLimit = includeTasks ? Math.max(4, Math.ceil(limit * 0.4)) : 0

  const [pageResults, taskResults] = await Promise.all([
    searchPages(db, spaceId, userId, trimmed, {
      mode: options.mode,
      limit: pageLimit,
      scope,
      authSecret: options.authSecret,
    }),
    includeTasks
      ? searchProjectTasks(db, spaceId, userId, trimmed, {
          mode: options.mode,
          limit: taskLimit,
          authSecret: options.authSecret,
        })
      : Promise.resolve([]),
  ])

  const pageHits: WorkspaceSearchPageResult[] = pageResults.map((result) => ({
    resultType: 'page',
    id: result.id,
    title: result.title,
    icon: result.icon,
    kind: result.kind,
    snippet: result.snippet,
    matchType: result.matchType,
    updatedAt: result.updatedAt,
    score: result.score,
  }))

  const taskHits: WorkspaceSearchTaskResult[] = taskResults.map((result) => ({
    resultType: 'task',
    id: result.id,
    boardId: result.boardId,
    boardTitle: result.boardTitle,
    title: result.title,
    snippet: result.snippet,
    matchType: result.matchType,
    updatedAt: result.updatedAt,
    score: result.score,
  }))

  if (!includeTasks) {
    return pageHits.slice(0, limit)
  }

  return mergeWorkspaceResults(pageHits, taskHits, limit)
}
