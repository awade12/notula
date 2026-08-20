import { and, desc, eq, inArray, notInArray } from 'drizzle-orm'
import type { Hocuspocus } from '@hocuspocus/server'
import type { Db } from '../../db/client'
import { pageInsights } from '../../db/schema/insights'
import { pages } from '../../db/schema/pages'
import { spaceMembers, spaces } from '../../db/schema/spaces'
import { user } from '../../db/schema/auth'
import { requireSpaceMembership } from '../spaces/permissions'
import {
  broadcastInsightUpdate,
  broadcastInsightsChanged,
  isPageDocumentLive,
} from '../../collab/broadcast'
import * as Y from 'yjs'

export type InsightInput = {
  id: string
  kind: 'decision' | 'signal'
  content: string
  status: string
  owner: string
  source: string
  supersedes: string
  dueDate: string
}

export const INSIGHT_STATUSES = [
  'draft',
  'accepted',
  'superseded',
  'open',
  'resolved',
  'observed',
  'dismissed',
] as const

export type InsightStatus = (typeof INSIGHT_STATUSES)[number]

async function applyPageInsightSync(
  db: Db,
  spaceId: string,
  pageId: string,
  insights: InsightInput[],
) {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) throw new Error('Not found')

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(pageInsights)
      .where(eq(pageInsights.pageId, pageId))
    const existingById = new Map(existing.map((item) => [item.id, item]))
    const nextIds = insights.map((item) => item.id)

    if (nextIds.length === 0) {
      await tx.delete(pageInsights).where(eq(pageInsights.pageId, pageId))
    } else {
      await tx
        .delete(pageInsights)
        .where(
          and(
            eq(pageInsights.pageId, pageId),
            notInArray(pageInsights.id, nextIds),
          ),
        )
    }

    for (const insight of insights) {
      const current = existingById.get(insight.id)
      const unchanged =
        current &&
        current.kind === insight.kind &&
        current.content === insight.content &&
        current.status === insight.status &&
        current.owner === insight.owner &&
        current.source === insight.source &&
        current.supersedes === insight.supersedes &&
        current.dueDate === insight.dueDate

      if (unchanged) continue

      await tx
        .insert(pageInsights)
        .values({ ...insight, spaceId, pageId, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: pageInsights.id,
          set: {
            kind: insight.kind,
            content: insight.content,
            status: insight.status,
            owner: insight.owner,
            source: insight.source,
            supersedes: insight.supersedes,
            dueDate: insight.dueDate,
            updatedAt: new Date(),
          },
        })
    }
  })
}

export async function syncPageInsightsFromCollab(
  db: Db,
  spaceId: string,
  pageId: string,
  insights: InsightInput[],
) {
  await applyPageInsightSync(db, spaceId, pageId, insights)
}

export async function syncPageInsights(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
  insights: InsightInput[],
) {
  await requireSpaceMembership(db, spaceId, userId)
  await applyPageInsightSync(db, spaceId, pageId, insights)
}

const insightSelection = {
  id: pageInsights.id,
  kind: pageInsights.kind,
  content: pageInsights.content,
  status: pageInsights.status,
  owner: pageInsights.owner,
  source: pageInsights.source,
  supersedes: pageInsights.supersedes,
  dueDate: pageInsights.dueDate,
  pageId: pageInsights.pageId,
  pageTitle: pages.title,
  spaceId: pageInsights.spaceId,
  updatedAt: pageInsights.updatedAt,
}

async function enrichInsights<
  T extends {
    owner: string
    supersedes: string
  },
>(db: Db, insights: T[]) {
  const ownerIds = [
    ...new Set(insights.map((item) => item.owner).filter(Boolean)),
  ]
  const decisionIds = [
    ...new Set(insights.map((item) => item.supersedes).filter(Boolean)),
  ]
  const owners = ownerIds.length
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, ownerIds))
    : []
  const decisions = decisionIds.length
    ? await db
        .select({
          id: pageInsights.id,
          content: pageInsights.content,
          pageTitle: pages.title,
          pageId: pageInsights.pageId,
        })
        .from(pageInsights)
        .innerJoin(pages, eq(pageInsights.pageId, pages.id))
        .where(inArray(pageInsights.id, decisionIds))
    : []
  const ownerNames = new Map(owners.map((item) => [item.id, item.name]))
  const decisionNames = new Map(
    decisions.map((item) => [
      item.id,
      item.content || `Decision in ${item.pageTitle}`,
    ]),
  )
  const decisionPages = new Map(decisions.map((item) => [item.id, item.pageId]))

  return insights.map((item) => ({
    ...item,
    ownerName: ownerNames.get(item.owner) ?? item.owner,
    supersedesTitle: decisionNames.get(item.supersedes) ?? item.supersedes,
    supersedesPageId: decisionPages.get(item.supersedes),
  }))
}

function updateInsightInYjsState(
  state: Buffer | null,
  insightId: string,
  changes: { status?: string; dueDate?: string },
) {
  if (!state) return null
  const doc = new Y.Doc()
  Y.applyUpdate(doc, new Uint8Array(state))
  let changed = false

  function visit(node: unknown) {
    if (!(node instanceof Y.XmlElement || node instanceof Y.XmlFragment)) return

    if (node instanceof Y.XmlElement) {
      if (
        node.nodeName.toLowerCase() === 'blockcontainer' &&
        node.getAttribute('id') === insightId
      ) {
        for (const child of node.toArray()) {
          if (
            child instanceof Y.XmlElement &&
            child.nodeName.toLowerCase() === 'knowledge'
          ) {
            if (changes.status !== undefined) {
              child.setAttribute('status', changes.status)
            }
            if (changes.dueDate !== undefined) {
              child.setAttribute('dueDate', changes.dueDate)
            }
            changed = true
          }
        }
      }
    }

    for (const child of node.toArray()) visit(child)
  }

  visit(doc.getXmlFragment('document-store'))
  return changed ? Buffer.from(Y.encodeStateAsUpdate(doc)) : null
}

export async function updateInsight(
  db: Db,
  collab: Hocuspocus,
  spaceId: string,
  insightId: string,
  userId: string,
  changes: { status?: string; dueDate?: string },
) {
  await requireSpaceMembership(db, spaceId, userId)
  const [current] = await db
    .select({ insight: pageInsights, yjsState: pages.yjsState })
    .from(pageInsights)
    .innerJoin(pages, eq(pageInsights.pageId, pages.id))
    .where(
      and(eq(pageInsights.id, insightId), eq(pageInsights.spaceId, spaceId)),
    )
    .limit(1)
  if (!current) throw new Error('Not found')

  const pageId = current.insight.pageId
  const live = isPageDocumentLive(collab, pageId)

  await db
    .update(pageInsights)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(pageInsights.id, insightId))

  if (live) {
    broadcastInsightUpdate(collab, pageId, insightId, changes)
  } else {
    const nextState = updateInsightInYjsState(
      current.yjsState,
      insightId,
      changes,
    )
    if (nextState) {
      await db
        .update(pages)
        .set({ yjsState: nextState, updatedAt: new Date() })
        .where(eq(pages.id, pageId))
    }
  }

  broadcastInsightsChanged(collab, spaceId, pageId)
}

export async function getToday(db: Db, userId: string) {
  const selection = {
    ...insightSelection,
    spaceName: spaces.name,
  }

  const recentDecisions = await db
    .select(selection)
    .from(pageInsights)
    .innerJoin(pages, eq(pageInsights.pageId, pages.id))
    .innerJoin(spaces, eq(pageInsights.spaceId, spaces.id))
    .innerJoin(
      spaceMembers,
      and(
        eq(spaceMembers.spaceId, pageInsights.spaceId),
        eq(spaceMembers.userId, userId),
      ),
    )
    .where(eq(pageInsights.kind, 'decision'))
    .orderBy(desc(pageInsights.updatedAt))
    .limit(8)

  return {
    recentDecisions: await enrichInsights(db, recentDecisions),
  }
}

export async function listInsightOptions(
  db: Db,
  spaceId: string,
  userId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)
  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: spaceMembers.role,
    })
    .from(spaceMembers)
    .innerJoin(user, eq(spaceMembers.userId, user.id))
    .where(eq(spaceMembers.spaceId, spaceId))
    .orderBy(user.name)
  const decisions = await db
    .select({
      id: pageInsights.id,
      content: pageInsights.content,
      status: pageInsights.status,
      pageId: pageInsights.pageId,
      pageTitle: pages.title,
    })
    .from(pageInsights)
    .innerJoin(pages, eq(pageInsights.pageId, pages.id))
    .where(
      and(eq(pageInsights.spaceId, spaceId), eq(pageInsights.kind, 'decision')),
    )
    .orderBy(desc(pageInsights.updatedAt))
    .limit(100)

  return { members, decisions }
}
