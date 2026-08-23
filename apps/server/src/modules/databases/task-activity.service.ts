import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { taskActivity } from '../../db/schema/task-activity'

export type TaskActivityKind = 'comment' | 'status_change' | 'property_change' | 'created'

export type TaskActivityRecord = {
  id: string
  rowId: string
  actorId: string
  actorName: string
  kind: TaskActivityKind
  body: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export async function appendTaskActivity(
  db: Db,
  input: {
    rowId: string
    spaceId: string
    actorId: string
    actorName: string
    kind: TaskActivityKind
    body: string
    metadata?: Record<string, unknown> | null
  },
) {
  const id = randomUUID()
  await db.insert(taskActivity).values({
    id,
    rowId: input.rowId,
    spaceId: input.spaceId,
    actorId: input.actorId,
    actorName: input.actorName,
    kind: input.kind,
    body: input.body,
    metadata: input.metadata ?? null,
  })
  return id
}

export async function listTaskActivity(
  db: Db,
  spaceId: string,
  rowId: string,
  limit = 50,
): Promise<TaskActivityRecord[]> {
  const rows = await db
    .select({
      id: taskActivity.id,
      rowId: taskActivity.rowId,
      actorId: taskActivity.actorId,
      actorName: taskActivity.actorName,
      kind: taskActivity.kind,
      body: taskActivity.body,
      metadata: taskActivity.metadata,
      createdAt: taskActivity.createdAt,
    })
    .from(taskActivity)
    .where(and(eq(taskActivity.spaceId, spaceId), eq(taskActivity.rowId, rowId)))
    .orderBy(desc(taskActivity.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    kind: row.kind as TaskActivityKind,
    metadata: row.metadata ?? null,
  }))
}

export async function addTaskComment(
  db: Db,
  spaceId: string,
  rowId: string,
  actorId: string,
  actorName: string,
  body: string,
) {
  const trimmed = body.trim()
  if (!trimmed) {
    throw new Error('Comment cannot be empty')
  }

  const id = await appendTaskActivity(db, {
    rowId,
    spaceId,
    actorId,
    actorName,
    kind: 'comment',
    body: trimmed,
  })

  return { id }
}
