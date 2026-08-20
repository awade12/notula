import { and, asc, count, eq } from 'drizzle-orm'
import { databaseSchemaSchema, slugifyBoardPublicSlug } from '@notesapp/shared'
import type { Db } from '../../db/client'
import { databaseRows, databases, databaseViews } from '../../db/schema/databases'

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function normalizePublicSlug(input: string) {
  const slug = slugifyBoardPublicSlug(input)
  if (slug.length < 3) {
    throw new Error('Public URL must be at least 3 characters')
  }
  if (!PUBLIC_SLUG_PATTERN.test(slug)) {
    throw new Error('Public URL can only use lowercase letters, numbers, and hyphens')
  }
  return slug
}

export async function getPublicBoardBySlug(db: Db, slug: string) {
  const normalized = slug.trim().toLowerCase()

  const [database] = await db
    .select({
      id: databases.id,
      spaceId: databases.spaceId,
      title: databases.title,
      icon: databases.icon,
      schema: databases.schema,
      publicSlug: databases.publicSlug,
      updatedAt: databases.updatedAt,
    })
    .from(databases)
    .where(
      and(
        eq(databases.publicSlug, normalized),
        eq(databases.isPublic, true),
        eq(databases.isProjectBoard, true),
      ),
    )
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
    .where(eq(databaseViews.databaseId, database.id))
    .orderBy(asc(databaseViews.position))

  const boardView = views.find((view) => view.type === 'board') ?? views[0]
  const limit = 500

  const rows = await db
    .select({
      id: databaseRows.id,
      databaseId: databaseRows.databaseId,
      properties: databaseRows.properties,
      position: databaseRows.position,
      updatedAt: databaseRows.updatedAt,
    })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, database.id), eq(databaseRows.spaceId, database.spaceId)))
    .orderBy(asc(databaseRows.position))
    .limit(limit)

  const [totalRow] = await db
    .select({ total: count() })
    .from(databaseRows)
    .where(and(eq(databaseRows.databaseId, database.id), eq(databaseRows.spaceId, database.spaceId)))

  return {
    database: {
      id: database.id,
      spaceId: database.spaceId,
      title: database.title,
      icon: database.icon,
      schema: databaseSchemaSchema.parse(database.schema),
      publicSlug: database.publicSlug,
      views,
      updatedAt: database.updatedAt.toISOString(),
    },
    rows: rows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString(),
    })),
    rowsTotal: totalRow?.total ?? rows.length,
    boardViewId: boardView?.id ?? null,
  }
}

export async function updateBoardPublicSettings(
  db: Db,
  spaceId: string,
  databaseId: string,
  input: { isPublic?: boolean; publicSlug?: string | null },
) {
  const [database] = await db
    .select({
      id: databases.id,
      title: databases.title,
      isProjectBoard: databases.isProjectBoard,
      isPublic: databases.isPublic,
      publicSlug: databases.publicSlug,
    })
    .from(databases)
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))
    .limit(1)

  if (!database) {
    throw new Error('Not found')
  }

  if (!database.isProjectBoard) {
    throw new Error('Only project boards can be published')
  }

  const nextIsPublic = input.isPublic ?? database.isPublic
  let nextSlug = database.publicSlug

  if (input.publicSlug !== undefined) {
    nextSlug =
      input.publicSlug === null || input.publicSlug.trim() === ''
        ? null
        : normalizePublicSlug(input.publicSlug)
  }

  if (nextIsPublic && !nextSlug) {
    nextSlug = normalizePublicSlug(database.title)
  }

  if (nextIsPublic && !nextSlug) {
    throw new Error('Set a public URL before publishing')
  }

  if (nextSlug) {
    const [conflict] = await db
      .select({ id: databases.id })
      .from(databases)
      .where(and(eq(databases.publicSlug, nextSlug), eq(databases.isPublic, true)))
      .limit(1)

    if (conflict && conflict.id !== databaseId) {
      throw new Error('That public URL is already taken')
    }
  }

  await db
    .update(databases)
    .set({
      isPublic: nextIsPublic,
      publicSlug: nextSlug,
      updatedAt: new Date(),
    })
    .where(and(eq(databases.id, databaseId), eq(databases.spaceId, spaceId)))

  return {
    id: databaseId,
    isPublic: nextIsPublic,
    publicSlug: nextSlug,
  }
}
