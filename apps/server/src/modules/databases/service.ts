import { randomUUID } from 'node:crypto'
import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'
import type { Hocuspocus } from '@hocuspocus/server'
import {
  createDefaultRowValues,
  databaseSchemaSchema,
  DEFAULT_SELECT_SCHEMA,
  findProperty,
  parseCellValue,
  PROJECT_BOARD_PROPERTY_IDS,
  PROJECT_BOARD_SCHEMA,
  type DatabaseSchema,
  type FilterRule,
  type SortRule,
} from '@notesapp/shared'
import { buildSortClause, combineFilters } from './query/build-query'
import type { Db } from '../../db/client'
import {
  databaseRows,
  databases,
  databaseViews,
  type DatabaseViewConfig,
} from '../../db/schema/databases'
import { pages } from '../../db/schema/pages'
import { requireSpaceMembership } from '../spaces/permissions'
import {
  initialPagePosition,
  positionAfter,
  positionBetween,
} from '../pages/ordering'
import {
  broadcastDatabaseRowUpdate,
} from '../../collab/broadcast'
import {
  readTaskDescriptionText,
  readTaskTitle,
} from '../ai/retrieval'
import { scheduleTaskEmbeddingIndex } from '../ai/index-task-embedding'
import { user } from '../../db/schema/auth'
import { appendTaskActivity } from './task-activity.service'

async function getActorName(db: Db, userId: string) {
  const [row] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).limit(1)
  return row?.name?.trim() || 'Someone'
}

function formatActivityValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Empty'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Empty'
    return value.join(', ')
  }
  return JSON.stringify(value)
}

function formatPropertyActivityBody(
  property: { id: string; name: string; type: string; config?: { options?: Array<{ id: string; label: string }> } },
  previousValue: unknown,
  nextValue: unknown,
) {
  if (property.id === 'status') {
    return `${formatActivityValue(previousValue)} → ${formatActivityValue(nextValue)}`
  }

  const labelFor = (value: unknown) => {
    if (property.type === 'select' && typeof value === 'string') {
      return property.config?.options?.find((option) => option.id === value)?.label ?? value
    }
    if (property.type === 'multi_select' && Array.isArray(value)) {
      const labels = value
        .filter((item): item is string => typeof item === 'string')
        .map((id) => property.config?.options?.find((option) => option.id === id)?.label ?? id)
      return labels.length > 0 ? labels.join(', ') : 'Empty'
    }
    return formatActivityValue(value)
  }

  return `${property.name}: ${labelFor(previousValue)} → ${labelFor(nextValue)}`
}

async function recordProjectTaskActivity(
  db: Db,
  input: {
    spaceId: string
    rowId: string
    userId: string
    kind: 'status_change' | 'property_change' | 'created' | 'comment'
    body: string
    metadata?: Record<string, unknown>
  },
) {
  const actorName = await getActorName(db, input.userId)
  await appendTaskActivity(db, {
    rowId: input.rowId,
    spaceId: input.spaceId,
    actorId: input.userId,
    actorName,
    kind: input.kind,
    body: input.body,
    metadata: input.metadata ?? null,
  })
}

async function filterValidPageIds(db: Db, spaceId: string, pageIds: string[]) {
  if (pageIds.length === 0) return []

  const rows = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), inArray(pages.id, pageIds)))

  const valid = new Set(rows.map((row) => row.id))
  return pageIds.filter((pageId) => valid.has(pageId))
}

export async function updateRowCellWithBroadcast(
  db: Db,
  collab: Hocuspocus,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  input: { propertyId: string; value: unknown },
  authSecret?: string,
) {
  const result = await updateRowCell(db, spaceId, databaseId, rowId, userId, input, authSecret)
  broadcastDatabaseRowUpdate(collab, databaseId, {
    rowId,
    propertyId: input.propertyId,
    value: result.value,
    properties: result.properties,
  })
  return result
}

export async function createRowWithBroadcast(
  db: Db,
  collab: Hocuspocus,
  spaceId: string,
  databaseId: string,
  userId: string,
  input?: { properties?: Record<string, unknown> },
  authSecret?: string,
) {
  const row = await createRow(db, spaceId, databaseId, userId, input, authSecret)
  broadcastDatabaseRowUpdate(collab, databaseId, {
    rowId: row.id,
    action: 'create',
    row: {
      ...row,
      updatedAt: row.updatedAt.toISOString(),
    },
  })
  return row
}

export async function deleteRowWithBroadcast(
  db: Db,
  collab: Hocuspocus,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
) {
  const result = await deleteRow(db, spaceId, databaseId, rowId, userId)
  broadcastDatabaseRowUpdate(collab, databaseId, {
    rowId,
    action: 'delete',
  })
  return result
}

async function assertFolderParent(
  db: Db,
  spaceId: string,
  parentId: string | null | undefined,
) {
  if (!parentId) return

  const [parent] = await db
    .select({ id: pages.id, kind: pages.kind })
    .from(pages)
    .where(and(eq(pages.id, parentId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!parent) {
    throw new Error('Invalid parent')
  }

  if (parent.kind !== 'folder') {
    throw new Error('Databases can only live inside folders')
  }
}

function parseDatabaseSchema(schema: unknown): DatabaseSchema {
  return databaseSchemaSchema.parse(schema)
}

export async function listDatabases(
  db: Db,
  spaceId: string,
  userId: string,
  options?: { parentId?: string | null; projectBoards?: boolean },
) {
  await requireSpaceMembership(db, spaceId, userId)

  const parentId = options?.parentId
  const projectBoards = options?.projectBoards

  let filter = eq(databases.spaceId, spaceId)

  if (projectBoards) {
    filter = and(filter, eq(databases.isProjectBoard, true))!
  } else if (parentId !== undefined) {
    filter =
      parentId === null
        ? and(filter, isNull(databases.parentId), eq(databases.isProjectBoard, false))!
        : and(filter, eq(databases.parentId, parentId))!
  } else {
    filter = and(filter, eq(databases.isProjectBoard, false))!
  }

  return db
    .select({
      id: databases.id,
      spaceId: databases.spaceId,
      parentId: databases.parentId,
      title: databases.title,
      icon: databases.icon,
      isProjectBoard: databases.isProjectBoard,
      isPublic: databases.isPublic,
      publicSlug: databases.publicSlug,
      updatedAt: databases.updatedAt,
    })
    .from(databases)
    .where(filter)
    .orderBy(asc(databases.title))
}

export async function createDatabase(
  db: Db,
  spaceId: string,
  userId: string,
  input: {
    title?: string
    parentId?: string | null
    icon?: string | null
    schema?: DatabaseSchema
    isProjectBoard?: boolean
  },
) {
  await requireSpaceMembership(db, spaceId, userId)

  const isProjectBoard = input.isProjectBoard === true
  if (isProjectBoard) {
    if (input.parentId) {
      throw new Error('Project boards cannot be nested in folders')
    }
  } else {
    await assertFolderParent(db, spaceId, input.parentId)
  }

  const schema = input.schema
    ? parseDatabaseSchema(input.schema)
    : isProjectBoard
      ? PROJECT_BOARD_SCHEMA
      : DEFAULT_SELECT_SCHEMA
  const id = randomUUID()
  const viewId = randomUUID()
  const title = input.title?.trim() || (isProjectBoard ? 'Untitled board' : 'Untitled database')

  await db.insert(databases).values({
    id,
    spaceId,
    parentId: isProjectBoard ? null : (input.parentId ?? null),
    title,
    icon: input.icon ?? null,
    schema,
    isProjectBoard,
  })

  const propertyIds = schema.properties.map((property) => property.id)
  const statusPropertyId =
    schema.properties.find((property) => property.id === 'status')?.id ??
    schema.properties.find((property) => property.type === 'select')?.id ??
    null

  const viewConfig: DatabaseViewConfig = isProjectBoard
    ? {
        propertyIds,
        filters: [],
        sorts: [],
        groupByPropertyId: statusPropertyId,
      }
    : {
        propertyIds,
      }

  const boardViewPosition = initialPagePosition([])

  await db.insert(databaseViews).values({
    id: viewId,
    databaseId: id,
    spaceId,
    type: isProjectBoard ? 'board' : 'table',
    title: isProjectBoard ? 'Board' : 'Table',
    config: viewConfig,
    position: boardViewPosition,
  })

  if (isProjectBoard) {
    await db.insert(databaseViews).values({
      id: randomUUID(),
      databaseId: id,
      spaceId,
      type: 'table',
      title: 'Table',
      config: {
        propertyIds,
        filters: [],
        sorts: [],
      },
      position: positionAfter([boardViewPosition]),
    })
  }

  return getDatabase(db, spaceId, id, userId)
}

export async function getDatabase(db: Db, spaceId: string, databaseId: string, userId: string) {
  await requireSpaceMembership(db, spaceId, userId)

  const [database] = await db
    .select({
      id: databases.id,
      spaceId: databases.spaceId,
      parentId: databases.parentId,
      title: databases.title,
      icon: databases.icon,
      schema: databases.schema,
      isProjectBoard: databases.isProjectBoard,
      isPublic: databases.isPublic,
      publicSlug: databases.publicSlug,
      updatedAt: databases.updatedAt,
    })
    .from(databases)
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))
    .limit(1)

  if (!database) {
    throw new Error('Not found')
  }

  const views = await db
    .select({
      id: databaseViews.id,
      type: databaseViews.type,
      title: databaseViews.title,
      config: databaseViews.config,
      position: databaseViews.position,
    })
    .from(databaseViews)
    .where(eq(databaseViews.databaseId, databaseId))
    .orderBy(asc(databaseViews.position))

  return {
    ...database,
    schema: parseDatabaseSchema(database.schema),
    views,
    updatedAt: database.updatedAt.toISOString(),
  }
}

export async function updateDatabase(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
  input: { title?: string; icon?: string | null },
) {
  await requireSpaceMembership(db, spaceId, userId)
  await getDatabase(db, spaceId, databaseId, userId)

  const updates: { title?: string; icon?: string | null; updatedAt: Date } = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) {
    updates.title = input.title.trim() || 'Untitled database'
  }

  if (input.icon !== undefined) {
    updates.icon = input.icon
  }

  await db
    .update(databases)
    .set(updates)
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))

  return getDatabase(db, spaceId, databaseId, userId)
}

export async function deleteDatabase(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
) {
  await requireSpaceMembership(db, spaceId, userId)
  await getDatabase(db, spaceId, databaseId, userId)

  await db
    .delete(databases)
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))

  return { deletedId: databaseId }
}

export type ListRowsOptions = {
  filters?: FilterRule[]
  sorts?: SortRule[]
  limit?: number
  offset?: number
}

export async function listRows(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
  options?: ListRowsOptions,
) {
  await getDatabase(db, spaceId, databaseId, userId)

  const limit = Math.min(options?.limit ?? 200, 2000)
  const offset = options?.offset ?? 0
  const filterSql = combineFilters(options?.filters)
  const orderClauses = buildSortClause(options?.sorts)

  const whereClause = filterSql
    ? and(
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
        filterSql,
      )
    : and(eq(databaseRows.databaseId, databaseId), eq(databaseRows.spaceId, spaceId))

  const rows = await db
    .select({
      id: databaseRows.id,
      databaseId: databaseRows.databaseId,
      properties: databaseRows.properties,
      position: databaseRows.position,
      updatedAt: databaseRows.updatedAt,
    })
    .from(databaseRows)
    .where(whereClause)
    .orderBy(...orderClauses)
    .limit(limit)
    .offset(offset)

  const [totalRow] = await db
    .select({ total: count() })
    .from(databaseRows)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  return {
    rows,
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
  }
}

export async function createRow(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
  input?: { properties?: Record<string, unknown> },
  authSecret?: string,
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)

  const siblings = await db
    .select({ position: databaseRows.position })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, databaseId), eq(databaseRows.spaceId, spaceId)))
    .orderBy(asc(databaseRows.position))

  const position =
    siblings.length === 0
      ? initialPagePosition([])
      : positionAfter(siblings.map((row) => row.position))

  const id = randomUUID()
  const properties = createDefaultRowValues(database.schema)

  if (input?.properties) {
    for (const [propertyId, rawValue] of Object.entries(input.properties)) {
      const property = findProperty(database.schema.properties, propertyId)
      if (!property) continue
      properties[propertyId] = parseCellValue(property, rawValue)
    }
  }

  await db.insert(databaseRows).values({
    id,
    databaseId,
    spaceId,
    properties,
    position,
  })

  if (authSecret && database.isProjectBoard) {
    scheduleTaskEmbeddingIndex(
      db,
      authSecret,
      spaceId,
      id,
      database.title,
      readTaskTitle(properties),
      readTaskDescriptionText(properties),
    )
    await recordProjectTaskActivity(db, {
      spaceId,
      rowId: id,
      userId,
      kind: 'created',
      body: 'Created this task',
    })

    const parentTaskId = properties[PROJECT_BOARD_PROPERTY_IDS.parentTask]
    if (typeof parentTaskId === 'string' && parentTaskId.trim()) {
      await recordProjectTaskActivity(db, {
        spaceId,
        rowId: parentTaskId,
        userId,
        kind: 'property_change',
        body: `Added subtask: ${readTaskTitle(properties) || 'Untitled'}`,
        metadata: {
          propertyId: PROJECT_BOARD_PROPERTY_IDS.parentTask,
          subtaskId: id,
          subtaskTitle: readTaskTitle(properties),
        },
      })
    }
  }

  return {
    id,
    databaseId,
    properties,
    position,
    updatedAt: new Date(),
  }
}

export async function updateRowCell(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  input: { propertyId: string; value: unknown },
  authSecret?: string,
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)
  const property = findProperty(database.schema.properties, input.propertyId)

  if (!property) {
    throw new Error('Invalid property')
  }

  const parsedValue = parseCellValue(property, input.value)
  const nextValue =
    property.type === 'relation' &&
    input.propertyId === PROJECT_BOARD_PROPERTY_IDS.linkedNote
      ? await filterValidPageIds(db, spaceId, parsedValue as string[])
      : parsedValue

  const [row] = await db
    .select({
      id: databaseRows.id,
      properties: databaseRows.properties,
    })
    .from(databaseRows)
    .where(
      and(
        eq(databaseRows.id, rowId),
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
      ),
    )
    .limit(1)

  if (!row) {
    throw new Error('Not found')
  }

  const nextProperties = {
    ...row.properties,
    [input.propertyId]: nextValue,
  }

  await db
    .update(databaseRows)
    .set({
      properties: nextProperties,
      updatedAt: new Date(),
    })
    .where(eq(databaseRows.id, rowId))

  if (authSecret && database.isProjectBoard) {
    scheduleTaskEmbeddingIndex(
      db,
      authSecret,
      spaceId,
      rowId,
      database.title,
      readTaskTitle(nextProperties),
      readTaskDescriptionText(nextProperties),
    )
  }

  const previousValue = row.properties[input.propertyId]
  if (
    database.isProjectBoard &&
    JSON.stringify(previousValue) !== JSON.stringify(nextValue)
  ) {
    const isStatus = input.propertyId === 'status'
    await recordProjectTaskActivity(db, {
      spaceId,
      rowId,
      userId,
      kind: isStatus ? 'status_change' : 'property_change',
      body: isStatus
        ? formatPropertyActivityBody(property, previousValue, nextValue)
        : formatPropertyActivityBody(property, previousValue, nextValue),
      metadata: {
        propertyId: input.propertyId,
        propertyName: property.name,
        from: previousValue,
        to: nextValue,
      },
    })

    if (input.propertyId === PROJECT_BOARD_PROPERTY_IDS.parentTask) {
      const previousParent =
        typeof previousValue === 'string' && previousValue.trim() ? previousValue.trim() : ''
      const nextParent = typeof nextValue === 'string' && nextValue.trim() ? nextValue.trim() : ''

      if (nextParent && nextParent !== previousParent) {
        await recordProjectTaskActivity(db, {
          spaceId,
          rowId: nextParent,
          userId,
          kind: 'property_change',
          body: `Added subtask: ${readTaskTitle(nextProperties) || 'Untitled'}`,
          metadata: {
            propertyId: PROJECT_BOARD_PROPERTY_IDS.parentTask,
            subtaskId: rowId,
            subtaskTitle: readTaskTitle(nextProperties),
          },
        })
      }
    }
  }

  return {
    id: rowId,
    propertyId: input.propertyId,
    value: nextValue,
    properties: nextProperties,
  }
}

export async function deleteRow(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
) {
  await getDatabase(db, spaceId, databaseId, userId)

  const [row] = await db
    .select({ id: databaseRows.id })
    .from(databaseRows)
    .where(
      and(
        eq(databaseRows.id, rowId),
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
      ),
    )
    .limit(1)

  if (!row) {
    throw new Error('Not found')
  }

  await db.delete(databaseRows).where(eq(databaseRows.id, rowId))

  return { deletedId: rowId }
}

type RowPositionInput = { beforeId?: string | null; afterId?: string | null }

function computeRowPosition(
  siblings: { id: string; position: string }[],
  rowId: string,
  input: RowPositionInput,
) {
  const others = siblings.filter((row) => row.id !== rowId)

  if (input.beforeId) {
    const beforeIndex = others.findIndex((row) => row.id === input.beforeId)
    if (beforeIndex === -1) throw new Error('Invalid beforeId')
    const beforePos = others[beforeIndex]?.position ?? null
    const prevPos = beforeIndex > 0 ? (others[beforeIndex - 1]?.position ?? null) : null
    return positionBetween(prevPos, beforePos)
  }

  if (input.afterId) {
    const afterIndex = others.findIndex((row) => row.id === input.afterId)
    if (afterIndex === -1) throw new Error('Invalid afterId')
    const afterPos = others[afterIndex]?.position ?? null
    const nextPos =
      afterIndex < others.length - 1 ? (others[afterIndex + 1]?.position ?? null) : null
    return positionBetween(afterPos, nextPos)
  }

  return positionAfter(others.map((row) => row.position))
}

export async function reorderRow(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  input: RowPositionInput,
) {
  await getDatabase(db, spaceId, databaseId, userId)

  const siblings = await db
    .select({ id: databaseRows.id, position: databaseRows.position })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, databaseId), eq(databaseRows.spaceId, spaceId)))
    .orderBy(asc(databaseRows.position))

  const position = computeRowPosition(siblings, rowId, input)

  await db
    .update(databaseRows)
    .set({ position, updatedAt: new Date() })
    .where(eq(databaseRows.id, rowId))

  return { id: rowId, position }
}

export async function moveKanbanRow(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  input: {
    statusPropertyId?: string
    statusValue?: unknown
    beforeId?: string | null
    afterId?: string | null
  },
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)

  const [row] = await db
    .select({
      id: databaseRows.id,
      properties: databaseRows.properties,
    })
    .from(databaseRows)
    .where(
      and(
        eq(databaseRows.id, rowId),
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
      ),
    )
    .limit(1)

  if (!row) {
    throw new Error('Not found')
  }

  let nextProperties = row.properties
  if (input.statusPropertyId !== undefined) {
    const property = findProperty(database.schema.properties, input.statusPropertyId)
    if (!property) {
      throw new Error('Invalid property')
    }

    const parsedValue = parseCellValue(property, input.statusValue)
    nextProperties = {
      ...row.properties,
      [input.statusPropertyId]: parsedValue,
    }
  }

  const siblings = await db
    .select({ id: databaseRows.id, position: databaseRows.position })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, databaseId), eq(databaseRows.spaceId, spaceId)))
    .orderBy(asc(databaseRows.position))

  const shouldReorder = Boolean(input.beforeId || input.afterId)
  const position = shouldReorder
    ? computeRowPosition(siblings, rowId, input)
    : undefined

  const patch: { properties: typeof nextProperties; position?: string; updatedAt: Date } = {
    properties: nextProperties,
    updatedAt: new Date(),
  }
  if (position) {
    patch.position = position
  }

  await db.update(databaseRows).set(patch).where(eq(databaseRows.id, rowId))

  if (
    database.isProjectBoard &&
    input.statusPropertyId &&
    row.properties[input.statusPropertyId] !== nextProperties[input.statusPropertyId]
  ) {
    await recordProjectTaskActivity(db, {
      spaceId,
      rowId,
      userId,
      kind: 'status_change',
      body: `${formatActivityValue(row.properties[input.statusPropertyId])} → ${formatActivityValue(nextProperties[input.statusPropertyId])}`,
      metadata: {
        propertyId: input.statusPropertyId,
        from: row.properties[input.statusPropertyId],
        to: nextProperties[input.statusPropertyId],
      },
    })
  }

  return {
    id: rowId,
    position: position ?? siblings.find((item) => item.id === rowId)?.position ?? '',
    properties: nextProperties,
  }
}

export async function moveKanbanRowWithBroadcast(
  db: Db,
  collab: Hocuspocus,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  input: {
    statusPropertyId?: string
    statusValue?: unknown
    beforeId?: string | null
    afterId?: string | null
  },
) {
  const result = await moveKanbanRow(db, spaceId, databaseId, rowId, userId, input)

  if (input.statusPropertyId) {
    broadcastDatabaseRowUpdate(collab, databaseId, {
      rowId,
      propertyId: input.statusPropertyId,
      value: result.properties[input.statusPropertyId],
      properties: result.properties,
    })
  }

  return result
}

export async function duplicateRow(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  userId: string,
  authSecret?: string,
) {
  await getDatabase(db, spaceId, databaseId, userId)

  const [row] = await db
    .select({
      id: databaseRows.id,
      properties: databaseRows.properties,
    })
    .from(databaseRows)
    .where(
      and(
        eq(databaseRows.id, rowId),
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
      ),
    )
    .limit(1)

  if (!row) {
    throw new Error('Not found')
  }

  const nextProperties = { ...row.properties }
  const rawTitle = nextProperties.title
  if (typeof rawTitle === 'string' && rawTitle.trim()) {
    nextProperties.title = `${rawTitle.trim()} (copy)`
  }

  return createRow(db, spaceId, databaseId, userId, { properties: nextProperties }, authSecret)
}

export async function moveRowToBoard(
  db: Db,
  spaceId: string,
  databaseId: string,
  rowId: string,
  targetBoardId: string,
  userId: string,
) {
  await getDatabase(db, spaceId, databaseId, userId)
  const targetBoard = await getDatabase(db, spaceId, targetBoardId, userId)

  if (!targetBoard.isProjectBoard) {
    throw new Error('Target must be a project board')
  }

  const [row] = await db
    .select({ id: databaseRows.id })
    .from(databaseRows)
    .where(
      and(
        eq(databaseRows.id, rowId),
        eq(databaseRows.databaseId, databaseId),
        eq(databaseRows.spaceId, spaceId),
      ),
    )
    .limit(1)

  if (!row) {
    throw new Error('Not found')
  }

  const siblings = await db
    .select({ position: databaseRows.position })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, targetBoardId), eq(databaseRows.spaceId, spaceId)))
    .orderBy(asc(databaseRows.position))

  const position =
    siblings.length === 0
      ? initialPagePosition([])
      : positionAfter(siblings.map((item) => item.position))

  await db
    .update(databaseRows)
    .set({
      databaseId: targetBoardId,
      position,
      updatedAt: new Date(),
    })
    .where(eq(databaseRows.id, rowId))

  await recordProjectTaskActivity(db, {
    spaceId,
    rowId,
    userId,
    kind: 'property_change',
    body: `Moved to ${targetBoard.title}`,
    metadata: { targetBoardId },
  })

  return { id: rowId, databaseId: targetBoardId }
}
