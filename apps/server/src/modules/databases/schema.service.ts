import { and, eq } from 'drizzle-orm'
import {
  createDefaultRowValues,
  databaseSchemaSchema,
  type DatabaseSchema,
} from '@notesapp/shared'
import type { Db } from '../../db/client'
import { databaseRows, databases, databaseViews } from '../../db/schema/databases'
import { getDatabase } from './service'

function parseDatabaseSchema(schema: unknown): DatabaseSchema {
  const parsed = databaseSchemaSchema.parse(schema)
  const ids = new Set(parsed.properties.map((property) => property.id))
  if (ids.size !== parsed.properties.length) {
    throw new Error('Duplicate property ids')
  }
  return parsed
}

export async function updateDatabaseSchema(
  db: Db,
  spaceId: string,
  databaseId: string,
  userId: string,
  input: { schema: DatabaseSchema },
) {
  const database = await getDatabase(db, spaceId, databaseId, userId)
  const nextSchema = parseDatabaseSchema(input.schema)

  const oldIds = new Set(database.schema.properties.map((property) => property.id))
  const newIds = new Set(nextSchema.properties.map((property) => property.id))
  const added = nextSchema.properties.filter((property) => !oldIds.has(property.id))

  await db
    .update(databases)
    .set({ schema: nextSchema, updatedAt: new Date() })
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))

  const rows = await db
    .select({ id: databaseRows.id, properties: databaseRows.properties })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, databaseId), eq(databaseRows.spaceId, spaceId)))

  for (const row of rows) {
    const nextProperties: Record<string, unknown> = { ...row.properties }

    for (const property of added) {
      nextProperties[property.id] = createDefaultRowValues({
        properties: [property],
      })[property.id]
    }

    for (const key of Object.keys(nextProperties)) {
      if (!newIds.has(key)) {
        delete nextProperties[key]
      }
    }

    await db
      .update(databaseRows)
      .set({ properties: nextProperties, updatedAt: new Date() })
      .where(eq(databaseRows.id, row.id))
  }

  const views = await db
    .select({ id: databaseViews.id, config: databaseViews.config })
    .from(databaseViews)
    .where(eq(databaseViews.databaseId, databaseId))

  for (const view of views) {
    const config = view.config as { propertyIds?: string[] }
    const kept = (config.propertyIds ?? []).filter((propertyId) => newIds.has(propertyId))
    const appended = nextSchema.properties
      .map((property) => property.id)
      .filter((propertyId) => !kept.includes(propertyId))

    await db
      .update(databaseViews)
      .set({
        config: {
          ...config,
          propertyIds: [...kept, ...appended],
        },
      })
      .where(eq(databaseViews.id, view.id))
  }

  return getDatabase(db, spaceId, databaseId, userId)
}
