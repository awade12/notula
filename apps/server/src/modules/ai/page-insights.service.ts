import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { pageLinks } from '../../db/schema/links'
import { pages } from '../../db/schema/pages'
import { findSimilarPagesByEmbedding, semanticSearchPages } from '../ai/embeddings'
import { getUserAiConfig } from '../settings/service'
import { parseAiFeatureFlags } from '../ai/feature-flags'
import { getOrCreateUserSettings } from '../settings/service'
import { requireSpaceMembership } from '../spaces/permissions'
import { getBacklinks, getPage } from '../pages/service'
import { isPgvectorReady } from '../../lib/pgvector'

const STALE_DAYS = 90
const DUPLICATE_MIN_SCORE = 0.82

export type PageAiInsights = {
  stale: {
    isStale: boolean
    daysSinceUpdate: number
    backlinkCount: number
  } | null
  duplicates: Array<{
    id: string
    title: string
    icon: string | null
    score: number
  }> | null
  meetingPrep: {
    backlinks: Array<{ id: string; title: string; icon: string | null; updatedAt: string }>
    recentLinkedEdits: Array<{ id: string; title: string; icon: string | null; updatedAt: string }>
    relatedPages: Array<{ id: string; title: string; icon: string | null; score: number }>
  } | null
}

export async function getPageAiInsights(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
  authSecret: string,
): Promise<PageAiInsights> {
  await requireSpaceMembership(db, spaceId, userId)
  const page = await getPage(db, spaceId, pageId, userId)
  const settings = await getOrCreateUserSettings(db, userId)
  const flags = parseAiFeatureFlags(settings.aiFeatureFlags)

  const now = Date.now()
  const daysSinceUpdate = Math.floor((now - page.updatedAt.getTime()) / (1000 * 60 * 60 * 24))

  let stale: PageAiInsights['stale'] = null
  if (flags.stalePageDetector) {
    const backlinkRows = await db
      .select({ id: pages.id })
      .from(pageLinks)
      .innerJoin(pages, eq(pageLinks.sourcePageId, pages.id))
      .where(and(eq(pageLinks.targetPageId, pageId), eq(pageLinks.spaceId, spaceId)))

    const backlinkCount = backlinkRows.length
    stale = {
      isStale: daysSinceUpdate >= STALE_DAYS && backlinkCount > 0,
      daysSinceUpdate,
      backlinkCount,
    }
  }

  let duplicates: PageAiInsights['duplicates'] = null
  let meetingPrep: PageAiInsights['meetingPrep'] = null

  const aiConfig = await getUserAiConfig(db, userId, authSecret)
  const pgvectorReady = await isPgvectorReady(db)

  if (flags.duplicateDetection && aiConfig.apiKey && aiConfig.enableEmbeddings && pgvectorReady) {
    const similar = await findSimilarPagesByEmbedding(
      db,
      spaceId,
      pageId,
      5,
      DUPLICATE_MIN_SCORE,
    )
    duplicates = similar.map((row) => ({
      id: row.id,
      title: row.title,
      icon: row.icon,
      score: row.score,
    }))
  }

  if (flags.meetingPrep) {
    const backlinks = await getBacklinks(db, spaceId, pageId, userId)
    const backlinkDetails = await db
      .select({
        id: pages.id,
        title: pages.title,
        icon: pages.icon,
        updatedAt: pages.updatedAt,
      })
      .from(pageLinks)
      .innerJoin(pages, eq(pageLinks.sourcePageId, pages.id))
      .where(and(eq(pageLinks.targetPageId, pageId), eq(pageLinks.spaceId, spaceId)))
      .orderBy(desc(pages.updatedAt))
      .limit(8)

    let relatedPages: Array<{ id: string; title: string; icon: string | null; score: number }> = []

    if (aiConfig.apiKey && aiConfig.enableEmbeddings && pgvectorReady) {
      const query = `${page.title}\n\n${page.plaintext}`.trim().slice(0, 2000)
      if (query) {
        const semantic = await semanticSearchPages(db, spaceId, aiConfig.apiKey, query, 6)
        relatedPages = semantic
          .filter((row) => row.id !== pageId)
          .slice(0, 4)
          .map((row) => ({
            id: row.id,
            title: row.title,
            icon: row.icon,
            score: row.score,
          }))
      }
    }

    meetingPrep = {
      backlinks: backlinks.map((row) => ({
        id: row.id,
        title: row.title,
        icon: row.icon,
        updatedAt: backlinkDetails.find((b) => b.id === row.id)?.updatedAt.toISOString() ?? '',
      })),
      recentLinkedEdits: backlinkDetails.map((row) => ({
        id: row.id,
        title: row.title,
        icon: row.icon,
        updatedAt: row.updatedAt.toISOString(),
      })),
      relatedPages,
    }
  }

  return { stale, duplicates, meetingPrep }
}
