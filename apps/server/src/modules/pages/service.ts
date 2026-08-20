import { randomUUID } from 'node:crypto'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { pageLinks } from '../../db/schema/links'
import { pages } from '../../db/schema/pages'
import { requireSpaceMembership } from '../spaces/permissions'
import {
  initialPagePosition,
  positionAfter,
  positionBetween,
} from './ordering'
import { collectDescendantIds } from './collect-descendants'

export async function listPages(db: Db, spaceId: string, userId: string) {
  await requireSpaceMembership(db, spaceId, userId)

  return db
    .select({
      id: pages.id,
      spaceId: pages.spaceId,
      parentId: pages.parentId,
      kind: pages.kind,
      title: pages.title,
      position: pages.position,
      icon: pages.icon,
      openCommentCount: pages.openCommentCount,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(eq(pages.spaceId, spaceId))
    .orderBy(asc(pages.position))
}

export async function getPage(db: Db, spaceId: string, pageId: string, userId: string) {
  await requireSpaceMembership(db, spaceId, userId)

  const [page] = await db
    .select({
      id: pages.id,
      spaceId: pages.spaceId,
      parentId: pages.parentId,
      kind: pages.kind,
      title: pages.title,
      position: pages.position,
      icon: pages.icon,
      plaintext: pages.plaintext,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) {
    throw new Error('Not found')
  }

  return page
}

async function assertFolderParent(
  db: Db,
  spaceId: string,
  parentId: string | null | undefined,
) {
  if (!parentId) return

  const [parent] = await db
    .select({ kind: pages.kind })
    .from(pages)
    .where(and(eq(pages.id, parentId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!parent) {
    throw new Error('Invalid parent')
  }

  if (parent.kind !== 'folder') {
    throw new Error('Pages can only be nested inside folders')
  }
}

export async function createPage(
  db: Db,
  spaceId: string,
  userId: string,
  input: { title?: string; parentId?: string | null; kind?: 'note' | 'folder' },
) {
  await requireSpaceMembership(db, spaceId, userId)
  await assertFolderParent(db, spaceId, input.parentId)

  const kind = input.kind ?? 'note'
  const defaultTitle = kind === 'folder' ? 'New folder' : 'Untitled'

  const siblingFilter = input.parentId
    ? eq(pages.parentId, input.parentId)
    : isNull(pages.parentId)

  const siblings = await db
    .select({ position: pages.position })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), siblingFilter))
    .orderBy(asc(pages.position))

  const position =
    siblings.length === 0
      ? initialPagePosition([])
      : positionAfter(siblings.map((row) => row.position))

  const id = randomUUID()
  const title = input.title?.trim() || defaultTitle

  await db.insert(pages).values({
    id,
    spaceId,
    parentId: input.parentId ?? null,
    kind,
    title,
    position,
  })

  return {
    id,
    spaceId,
    parentId: input.parentId ?? null,
    kind,
    title,
    position,
    icon: null,
  }
}

export async function updatePage(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
  input: { title?: string; icon?: string | null; kind?: 'note' | 'folder' },
) {
  await requireSpaceMembership(db, spaceId, userId)
  const existing = await getPage(db, spaceId, pageId, userId)

  const updates: {
    title?: string
    icon?: string | null
    kind?: 'note' | 'folder'
    updatedAt: Date
  } = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) {
    const title = input.title.trim() || 'Untitled'
    updates.title = title.length > 200 ? `${title.slice(0, 197)}...` : title
  }

  if (input.icon !== undefined) {
    updates.icon = input.icon
  }

  if (input.kind !== undefined && input.kind !== existing.kind) {
    if (input.kind === 'note' && existing.kind === 'folder') {
      const [child] = await db
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.parentId, pageId), eq(pages.spaceId, spaceId)))
        .limit(1)

      if (child) {
        throw new Error('Move or delete items before converting to a note')
      }
    }

    updates.kind = input.kind
  }

  await db
    .update(pages)
    .set(updates)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))

  return getPage(db, spaceId, pageId, userId)
}

async function isDescendant(
  db: Db,
  spaceId: string,
  ancestorId: string,
  nodeId: string,
): Promise<boolean> {
  const [node] = await db
    .select({ parentId: pages.parentId })
    .from(pages)
    .where(and(eq(pages.id, nodeId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!node?.parentId) return false
  if (node.parentId === ancestorId) return true
  return isDescendant(db, spaceId, ancestorId, node.parentId)
}

export async function deletePage(db: Db, spaceId: string, pageId: string, userId: string) {
  await requireSpaceMembership(db, spaceId, userId)

  const spacePages = await db
    .select({ id: pages.id, parentId: pages.parentId })
    .from(pages)
    .where(eq(pages.spaceId, spaceId))

  if (!spacePages.some((page) => page.id === pageId)) {
    throw new Error('Not found')
  }

  const ids = collectDescendantIds(spacePages, pageId)
  await db.delete(pages).where(and(eq(pages.spaceId, spaceId), inArray(pages.id, ids)))

  return { deletedIds: ids }
}

export async function movePage(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
  input: {
    parentId: string | null
    beforeId?: string | null
    afterId?: string | null
  },
) {
  await requireSpaceMembership(db, spaceId, userId)
  await getPage(db, spaceId, pageId, userId)

  if (input.parentId && input.parentId === pageId) {
    throw new Error('Cannot move page into itself')
  }

  if (input.parentId && (await isDescendant(db, spaceId, pageId, input.parentId))) {
    throw new Error('Cannot move page into its descendant')
  }

  await assertFolderParent(db, spaceId, input.parentId)

  const siblingFilter = input.parentId
    ? eq(pages.parentId, input.parentId)
    : isNull(pages.parentId)

  const siblings = await db
    .select({ id: pages.id, position: pages.position })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), siblingFilter))
    .orderBy(asc(pages.position))

  const others = siblings.filter((row) => row.id !== pageId)
  let position: string

  if (input.beforeId) {
    const beforeIndex = others.findIndex((row) => row.id === input.beforeId)
    if (beforeIndex === -1) throw new Error('Invalid beforeId')
    const beforePos = others[beforeIndex]?.position ?? null
    const prevPos = beforeIndex > 0 ? (others[beforeIndex - 1]?.position ?? null) : null
    position = positionBetween(prevPos, beforePos)
  } else if (input.afterId) {
    const afterIndex = others.findIndex((row) => row.id === input.afterId)
    if (afterIndex === -1) throw new Error('Invalid afterId')
    const afterPos = others[afterIndex]?.position ?? null
    const nextPos =
      afterIndex < others.length - 1 ? (others[afterIndex + 1]?.position ?? null) : null
    position = positionBetween(afterPos, nextPos)
  } else if (others.length === 0) {
    position = initialPagePosition([])
  } else {
    position = positionAfter(others.map((row) => row.position))
  }

  await db
    .update(pages)
    .set({
      parentId: input.parentId,
      position,
      updatedAt: new Date(),
    })
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))

  return getPage(db, spaceId, pageId, userId)
}

export async function reorderPageAmongSiblings(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
  input: { beforeId?: string | null; afterId?: string | null },
) {
  const page = await getPage(db, spaceId, pageId, userId)
  return movePage(db, spaceId, pageId, userId, {
    parentId: page.parentId,
    beforeId: input.beforeId,
    afterId: input.afterId,
  })
}

export async function getPageYjsState(db: Db, pageId: string) {
  const [page] = await db
    .select({ yjsState: pages.yjsState })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)

  return page?.yjsState ?? null
}

export async function syncPageLinks(
  db: Db,
  spaceId: string,
  sourcePageId: string,
  targetPageIds: string[],
) {
  await db.delete(pageLinks).where(eq(pageLinks.sourcePageId, sourcePageId))

  const uniqueTargets = [...new Set(targetPageIds)].filter((id) => id !== sourcePageId)
  if (uniqueTargets.length === 0) return

  const validTargets = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), inArray(pages.id, uniqueTargets)))

  if (validTargets.length === 0) return

  await db.insert(pageLinks).values(
    validTargets.map((target) => ({
      id: randomUUID(),
      spaceId,
      sourcePageId,
      targetPageId: target.id,
    })),
  )
}

export async function getPagePreview(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)

  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      plaintext: pages.plaintext,
      openCommentCount: pages.openCommentCount,
    })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) {
    throw new Error('Not found')
  }

  const snippet = page.plaintext.trim().slice(0, 240)

  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    snippet: snippet.length > 0 ? snippet : null,
    openCommentCount: page.openCommentCount,
  }
}

export async function storePageDocument(
  db: Db,
  pageId: string,
  input: {
    state: Buffer
    title: string
    plaintext: string
    linkIds?: string[]
    openCommentCount?: number
  },
) {
  const page = await getPageForCollab(db, pageId)
  if (!page) return

  await db
    .update(pages)
    .set({
      yjsState: input.state,
      title: input.title,
      plaintext: input.plaintext,
      openCommentCount: input.openCommentCount ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId))

  if (input.linkIds) {
    await syncPageLinks(db, page.spaceId, pageId, input.linkIds)
  }
}

export async function getPageForCollab(db: Db, pageId: string) {
  const [page] = await db
    .select({
      id: pages.id,
      spaceId: pages.spaceId,
    })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)

  return page ?? null
}

export async function getBacklinks(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)
  await getPage(db, spaceId, pageId, userId)

  return db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
    })
    .from(pageLinks)
    .innerJoin(pages, eq(pageLinks.sourcePageId, pages.id))
    .where(and(eq(pageLinks.targetPageId, pageId), eq(pageLinks.spaceId, spaceId)))
    .orderBy(asc(pages.title))
}

export async function getPageBootstrap(
  db: Db,
  spaceId: string,
  pageId: string,
  userId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)

  const [page] = await db
    .select({
      title: pages.title,
      yjsState: pages.yjsState,
    })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) {
    throw new Error('Not found')
  }

  return {
    title: page.title,
    yjsState: page.yjsState ? Buffer.from(page.yjsState).toString('base64') : null,
  }
}
