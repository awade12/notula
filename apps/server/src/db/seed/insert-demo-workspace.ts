import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import {
  PROJECT_BOARD_SCHEMA,
  createDefaultRowValues,
  type DatabaseViewConfig,
} from '@notesapp/shared'
import type { Db } from '../client'
import { user } from '../schema/auth'
import { databaseRows, databases, databaseViews } from '../schema/databases'
import { pageLinks } from '../schema/links'
import { pages } from '../schema/pages'
import { spaceMembers, spaces } from '../schema/spaces'
import { initialPagePosition, positionAfter } from '../../modules/pages/ordering'
import {
  DEMO_BOARD_TITLE,
  DEMO_FOLDERS,
  DEMO_NOTES,
  DEMO_SPACE_NAME,
  DEMO_TASKS,
  DEMO_TEAMMATES,
} from './demo-content'
import { buildYjsStateFromMarkdown } from './build-yjs-from-markdown'

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function slugForDemo(ownerId: string) {
  return `acme-product-demo-${ownerId.slice(0, 8)}`
}

export async function findDemoSpace(db: Db, ownerId: string) {
  const slug = slugForDemo(ownerId)
  const [space] = await db.select().from(spaces).where(eq(spaces.slug, slug)).limit(1)
  return space ?? null
}

export async function deleteDemoSpace(db: Db, spaceId: string) {
  await db.delete(spaces).where(eq(spaces.id, spaceId))
}

export async function repairDemoNoteContent(db: Db, spaceId: string) {
  const noteRows = await db
    .select({
      id: pages.id,
      title: pages.title,
      plaintext: pages.plaintext,
      yjsState: pages.yjsState,
    })
    .from(pages)
    .where(eq(pages.spaceId, spaceId))

  let repaired = 0

  for (const row of noteRows) {
    if (row.yjsState && row.yjsState.length > 0) continue
    if (!row.plaintext.trim()) continue

    await db
      .update(pages)
      .set({
        yjsState: buildYjsStateFromMarkdown(row.plaintext, row.title),
        updatedAt: new Date(),
      })
      .where(eq(pages.id, row.id))

    repaired += 1
  }

  return repaired
}

async function resolveOwner(db: Db, email?: string) {
  if (email) {
    const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1)
    if (!row) throw new Error(`No user found with email ${email}`)
    return row
  }

  const rows = await db.select().from(user).limit(1)
  if (!rows[0]) {
    throw new Error('No users in the database. Sign up in the app first, then run db:seed.')
  }
  return rows[0]
}

export async function insertDemoWorkspace(
  db: Db,
  options: { email?: string; force?: boolean },
) {
  const owner = await resolveOwner(db, options.email)
  const existing = await findDemoSpace(db, owner.id)

  if (existing && !options.force) {
    const repaired = await repairDemoNoteContent(db, existing.id)
    return {
      spaceId: existing.id,
      spaceName: existing.name,
      created: false,
      repairedNotes: repaired,
      ownerEmail: owner.email,
    }
  }

  if (existing && options.force) {
    await deleteDemoSpace(db, existing.id)
  }

  const teammateIds = new Map<string, string>()

  for (const teammate of DEMO_TEAMMATES) {
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, teammate.email))
      .limit(1)

    const teammateId = existingUser?.id ?? randomUUID()

    if (!existingUser) {
      await db.insert(user).values({
        id: teammateId,
        name: teammate.name,
        email: teammate.email,
        emailVerified: false,
      })
    }

    teammateIds.set(teammate.key, teammateId)
  }

  const spaceId = randomUUID()
  const slug = slugForDemo(owner.id)

  await db.insert(spaces).values({
    id: spaceId,
    name: DEMO_SPACE_NAME,
    slug,
    ownerId: owner.id,
  })

  await db.insert(spaceMembers).values({
    id: randomUUID(),
    spaceId,
    userId: owner.id,
    role: 'owner',
  })

  for (const teammate of DEMO_TEAMMATES) {
    const teammateId = teammateIds.get(teammate.key)
    if (!teammateId) continue
    await db.insert(spaceMembers).values({
      id: randomUUID(),
      spaceId,
      userId: teammateId,
      role: teammate.role,
    })
  }

  const folderIds = new Map<string, string>()
  let rootPosition: string | null = null

  for (const folder of DEMO_FOLDERS) {
    const id = randomUUID()
    const position: string = rootPosition
      ? positionAfter([rootPosition])
      : initialPagePosition([])
    rootPosition = position
    folderIds.set(folder.key, id)

    await db.insert(pages).values({
      id,
      spaceId,
      parentId: null,
      kind: 'folder',
      title: folder.title,
      position,
      icon: folder.icon,
      plaintext: '',
      updatedAt: daysAgo(10),
    })
  }

  const noteIds = new Map<string, string>()
  const notesByFolder = new Map<string | undefined, typeof DEMO_NOTES>()

  for (const note of DEMO_NOTES) {
    const bucket = notesByFolder.get(note.folderKey) ?? []
    bucket.push(note)
    notesByFolder.set(note.folderKey, bucket)
  }

  const folderPositions = new Map<string, string[]>()

  for (const [folderKey, notes] of notesByFolder.entries()) {
    if (folderKey) folderPositions.set(folderKey, [])

    for (const note of notes) {
      const id = randomUUID()
      noteIds.set(note.key, id)

      if (folderKey) {
        const parentId = folderIds.get(folderKey)
        if (!parentId) continue
        const siblings = folderPositions.get(folderKey) ?? []
        const position: string =
          siblings.length === 0 ? initialPagePosition([]) : positionAfter(siblings)
        siblings.push(position)
        folderPositions.set(folderKey, siblings)

        await db.insert(pages).values({
          id,
          spaceId,
          parentId,
          kind: 'note',
          title: note.title,
          position,
          icon: note.icon,
          plaintext: note.plaintext,
          yjsState: buildYjsStateFromMarkdown(note.plaintext, note.title),
          updatedAt: daysAgo(note.daysAgo),
        })
        continue
      }

      const position: string = rootPosition
        ? positionAfter([rootPosition])
        : initialPagePosition([])
      rootPosition = position

      await db.insert(pages).values({
        id,
        spaceId,
        parentId: null,
        kind: 'note',
        title: note.title,
        position,
        icon: note.icon,
        plaintext: note.plaintext,
        yjsState: buildYjsStateFromMarkdown(note.plaintext, note.title),
        updatedAt: daysAgo(note.daysAgo),
      })
    }
  }

  for (const note of DEMO_NOTES) {
    if (!note.linksTo?.length) continue
    const sourceId = noteIds.get(note.key)
    if (!sourceId) continue

    for (const targetKey of note.linksTo) {
      const targetId = noteIds.get(targetKey)
      if (!targetId) continue

      await db.insert(pageLinks).values({
        id: randomUUID(),
        spaceId,
        sourcePageId: sourceId,
        targetPageId: targetId,
      })
    }
  }

  const boardId = randomUUID()
  const viewId = randomUUID()
  const schema = PROJECT_BOARD_SCHEMA
  const propertyIds = schema.properties.map((property) => property.id)
  const viewConfig: DatabaseViewConfig = {
    propertyIds,
    filters: [],
    sorts: [],
    groupByPropertyId: 'status',
  }

  await db.insert(databases).values({
    id: boardId,
    spaceId,
    parentId: null,
    title: DEMO_BOARD_TITLE,
    icon: '🎯',
    schema,
    isProjectBoard: true,
  })

  await db.insert(databaseViews).values({
    id: viewId,
    databaseId: boardId,
    spaceId,
    type: 'board',
    title: 'Board',
    config: viewConfig,
    position: initialPagePosition([]),
  })

  let taskPosition: string | null = null

  for (const task of DEMO_TASKS) {
    const id = randomUUID()
    const position: string = taskPosition
      ? positionAfter([taskPosition])
      : initialPagePosition([])
    taskPosition = position

    const properties = createDefaultRowValues(schema)
    properties.title = task.title
    properties.description = task.description
    properties.status = task.status
    properties.label = task.labels
    properties.milestone = task.milestone
    properties.priority = task.priority
    properties.estimate = task.estimate
    properties.due_date = task.dueDate ?? ''
    properties.assignee = task.assigneeKey
      ? (teammateIds.get(task.assigneeKey) ?? owner.id)
      : ''

    if (task.linkedNoteKey) {
      const linkedId = noteIds.get(task.linkedNoteKey)
      if (linkedId) {
        properties.linked_note = [linkedId]
      }
    }

    await db.insert(databaseRows).values({
      id,
      databaseId: boardId,
      spaceId,
      properties,
      position,
      updatedAt: daysAgo(Math.max(1, task.status === 'done' ? 14 : 2)),
    })
  }

  return {
    spaceId,
    spaceName: DEMO_SPACE_NAME,
    created: true,
    ownerEmail: owner.email,
    stats: {
      folders: DEMO_FOLDERS.length,
      notes: DEMO_NOTES.length,
      links: DEMO_NOTES.reduce((count, note) => count + (note.linksTo?.length ?? 0), 0),
      tasks: DEMO_TASKS.length,
      teammates: DEMO_TEAMMATES.length + 1,
    },
  }
}

export async function findUserByEmail(db: Db, email: string) {
  const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1)
  return row ?? null
}

export async function listUsers(db: Db) {
  return db.select({ id: user.id, email: user.email, name: user.name }).from(user)
}
