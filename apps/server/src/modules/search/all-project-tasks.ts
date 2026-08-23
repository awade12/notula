import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databaseRows, databases } from '../../db/schema/databases'
import { requireSpaceMembership } from '../spaces/permissions'
import { readTaskDescriptionSnippet, readTaskTitle } from './task-search'

export type AllProjectTaskRow = {
  id: string
  boardId: string
  boardTitle: string
  title: string
  snippet: string
  status: string | null
  assigneeId: string | null
  dueDate: string | null
  updatedAt: Date
}

export async function listAllProjectTasks(
  db: Db,
  spaceId: string,
  userId: string,
  limit = 200,
): Promise<AllProjectTaskRow[]> {
  await requireSpaceMembership(db, spaceId, userId)

  const rows = await db
    .select({
      id: databaseRows.id,
      boardId: databaseRows.databaseId,
      properties: databaseRows.properties,
      boardTitle: databases.title,
      updatedAt: databaseRows.updatedAt,
    })
    .from(databaseRows)
    .innerJoin(databases, eq(databaseRows.databaseId, databases.id))
    .where(and(eq(databaseRows.spaceId, spaceId), eq(databases.isProjectBoard, true)))
    .orderBy(desc(databaseRows.updatedAt))
    .limit(limit)

  return rows.map((row) => {
    const properties = row.properties as Record<string, unknown>
    const status = properties.status
    const assignee = properties.assignee
    const dueDate = properties.due_date

    return {
      id: row.id,
      boardId: row.boardId,
      boardTitle: row.boardTitle,
      title: readTaskTitle(properties),
      snippet: readTaskDescriptionSnippet(properties),
      status: typeof status === 'string' ? status : null,
      assigneeId: typeof assignee === 'string' ? assignee : null,
      dueDate: typeof dueDate === 'string' ? dueDate : null,
      updatedAt: row.updatedAt,
    }
  })
}
