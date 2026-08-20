import { randomUUID } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { databaseViewConfigSchema, findProperty, type DatabaseViewConfig } from '@notesapp/shared'
import type { Db } from '../../db/client'
import { databaseViews } from '../../db/schema/databases'
import { initialPagePosition, positionAfter } from '../pages/ordering'
import { getDatabase } from './service'

export async function createView(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
  input: {
    type: 'table' | 'board'
    title?: string
    groupByPropertyId?: string | null
  },
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)
  const propertyIds = database.schema.properties.map((property) => property.id)

  let groupByPropertyId: string | null = null
  if (input.type === 'board') {
    const candidate =
      input.groupByPropertyId ??
      database.schema.properties.find((property) => property.type === 'select')?.id ??
      null

    if (!candidate) {
      throw new Error('Board view requires a select property')
    }

    const property = findProperty(database.schema.properties, candidate)
    if (!property || property.type !== 'select') {
      throw new Error('Invalid group property')
    }

    groupByPropertyId = candidate
  }

  const siblings = await db
    .select({ position: databaseViews.position })
    .from(databaseViews)
    .where(eq(databaseViews.databaseId, databaseId))
    .orderBy(asc(databaseViews.position))

  const id = randomUUID()
  const config = databaseViewConfigSchema.parse({
    propertyIds,
    filters: [],
    sorts: [],
    groupByPropertyId,
  })

  await db.insert(databaseViews).values({
    id,
    databaseId,
    spaceId,
    type: input.type,
    title: input.title?.trim() || (input.type === 'board' ? 'Board' : 'Table'),
    config,
    position:
      siblings.length === 0
        ? initialPagePosition([])
        : positionAfter(siblings.map((view) => view.position)),
  })

  return getDatabase(db, spaceId, databaseId, userId)
}

export async function updateView(
  db: Db,
  spaceId: string,
  databaseId: string,
  viewId: string,
  userId: string,
  input: {
    title?: string
    config?: unknown
  },
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)
  const view = database.views.find((item) => item.id === viewId)

  if (!view) {
    throw new Error('View not found')
  }

  const updates: { title?: string; config?: DatabaseViewConfig } = {}

  if (input.title !== undefined) {
    updates.title = input.title.trim() || view.title
  }

  if (input.config !== undefined) {
    const parsed = databaseViewConfigSchema.parse(input.config)

    if (view.type === 'board' && parsed.groupByPropertyId) {
      const property = findProperty(database.schema.properties, parsed.groupByPropertyId)
      if (!property || property.type !== 'select') {
        throw new Error('Invalid group property')
      }
    }

    for (const propertyId of parsed.propertyIds) {
      if (!findProperty(database.schema.properties, propertyId)) {
        throw new Error('Invalid property in view')
      }
    }

    updates.config = parsed
  }

  await db
    .update(databaseViews)
    .set(updates)
    .where(
      and(
        eq(databaseViews.id, viewId),
        eq(databaseViews.databaseId, databaseId),
        eq(databaseViews.spaceId, spaceId),
      ),
    )

  return getDatabase(db, spaceId, databaseId, userId)
}
