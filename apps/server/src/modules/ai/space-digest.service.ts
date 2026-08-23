import { and, desc, eq, lt, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databaseRows, databases } from '../../db/schema/databases'
import { pageLinks } from '../../db/schema/links'
import { pages } from '../../db/schema/pages'
import { requireSpaceMembership } from '../spaces/permissions'

const STALE_DAYS = 90
const RECENT_DAYS = 7

export type SpaceAiDigestHighlight = {
  id: string
  label: string
  count: number
}

export type SpaceAiDigest = {
  generatedAt: string
  highlights: SpaceAiDigestHighlight[]
  summary: string
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function getSpaceAiDigest(
  db: Db,
  spaceId: string,
  userId: string,
): Promise<SpaceAiDigest> {
  await requireSpaceMembership(db, spaceId, userId)

  const recentCutoff = daysAgo(RECENT_DAYS)
  const staleCutoff = daysAgo(STALE_DAYS)
  const todayKey = formatDateKey(new Date())

  const [recentPages, stalePages, boardRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pages)
      .where(and(eq(pages.spaceId, spaceId), sql`${pages.updatedAt} >= ${recentCutoff}`)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pages)
      .innerJoin(pageLinks, eq(pageLinks.targetPageId, pages.id))
      .where(and(eq(pages.spaceId, spaceId), lt(pages.updatedAt, staleCutoff))),
    db
      .select({
        id: databaseRows.id,
        properties: databaseRows.properties,
      })
      .from(databaseRows)
      .innerJoin(databases, eq(databaseRows.databaseId, databases.id))
      .where(eq(databases.spaceId, spaceId)),
  ])

  let openTasks = 0
  let overdueTasks = 0

  for (const row of boardRows) {
    const properties = row.properties as Record<string, unknown>
    const status = typeof properties.status === 'string' ? properties.status : ''
    const isDone = status === 'done' || status === 'cancelled'
    if (!isDone) openTasks += 1

    const dueDate = typeof properties.due_date === 'string' ? properties.due_date : ''
    if (dueDate && dueDate < todayKey && !isDone) {
      overdueTasks += 1
    }
  }

  const recentPageCount = recentPages[0]?.count ?? 0
  const stalePageCount = stalePages[0]?.count ?? 0

  const highlights: SpaceAiDigestHighlight[] = [
    { id: 'recent_notes', label: 'Notes updated this week', count: recentPageCount },
    { id: 'open_tasks', label: 'Open tasks', count: openTasks },
    { id: 'overdue_tasks', label: 'Overdue tasks', count: overdueTasks },
    { id: 'stale_notes', label: 'Stale linked notes', count: stalePageCount },
  ].filter((item) => item.count > 0)

  const summaryParts: string[] = []

  if (recentPageCount > 0) {
    summaryParts.push(`${recentPageCount} note${recentPageCount === 1 ? '' : 's'} updated in the last ${RECENT_DAYS} days`)
  }
  if (openTasks > 0) {
    summaryParts.push(`${openTasks} open task${openTasks === 1 ? '' : 's'}`)
  }
  if (overdueTasks > 0) {
    summaryParts.push(`${overdueTasks} overdue`)
  }
  if (stalePageCount > 0) {
    summaryParts.push(`${stalePageCount} stale linked note${stalePageCount === 1 ? '' : 's'} may need a refresh`)
  }

  const recentTitles = await db
    .select({ title: pages.title })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), sql`${pages.updatedAt} >= ${recentCutoff}`))
    .orderBy(desc(pages.updatedAt))
    .limit(3)

  if (recentTitles.length > 0) {
    summaryParts.push(
      `Recently edited: ${recentTitles.map((page) => page.title.trim() || 'Untitled').join(', ')}`,
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    highlights,
    summary:
      summaryParts.length > 0
        ? summaryParts.join('. ') + '.'
        : 'Nothing urgent right now. Ask the teamspace a question to dig deeper.',
  }
}
