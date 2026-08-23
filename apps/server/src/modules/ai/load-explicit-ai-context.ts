import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databaseRows, databases } from '../../db/schema/databases'
import { pages } from '../../db/schema/pages'
import { requireSpaceMembership } from '../spaces/permissions'
import { readTaskDescriptionText, readTaskTitle } from '../search/task-search'
import {
  enrichRetrievedNotes,
  type AiContextRef,
  type AiWorkspaceCitation,
  type AiWorkspaceContext,
  type RetrievedNote,
  type RetrievedTask,
} from './retrieval'

export type { AiContextRef }

export async function loadExplicitAiContextRefs(
  db: Db,
  spaceId: string,
  userId: string,
  refs: AiContextRef[],
): Promise<{ notes: RetrievedNote[]; tasks: RetrievedTask[] }> {
  if (refs.length === 0) return { notes: [], tasks: [] }

  await requireSpaceMembership(db, spaceId, userId)

  const noteIds = refs.filter((ref) => ref.type === 'note').map((ref) => ref.id)
  const taskRefs = refs.filter((ref) => ref.type === 'task')

  const noteRows =
    noteIds.length > 0
      ? await db
          .select({
            id: pages.id,
            title: pages.title,
            plaintext: pages.plaintext,
          })
          .from(pages)
          .where(and(eq(pages.spaceId, spaceId), inArray(pages.id, noteIds)))
      : []

  let notes: RetrievedNote[] = noteRows.map((row) => ({
    id: row.id,
    title: row.title,
    snippet: row.plaintext.slice(0, 400),
  }))

  if (notes.length > 0) {
    notes = await enrichRetrievedNotes(db, spaceId, notes)
  }

  const tasks: RetrievedTask[] = []

  for (const ref of taskRefs) {
    const [row] = await db
      .select({
        id: databaseRows.id,
        boardId: databaseRows.databaseId,
        properties: databaseRows.properties,
        boardTitle: databases.title,
      })
      .from(databaseRows)
      .innerJoin(databases, eq(databaseRows.databaseId, databases.id))
      .where(
        and(
          eq(databaseRows.id, ref.id),
          eq(databaseRows.databaseId, ref.boardId),
          eq(databases.spaceId, spaceId),
        ),
      )
      .limit(1)

    if (!row) continue

    const properties = row.properties as Record<string, unknown>
    const title = readTaskTitle(properties)
    const description = readTaskDescriptionText(properties)

    tasks.push({
      id: row.id,
      boardId: row.boardId,
      title,
      boardTitle: row.boardTitle,
      snippet: description.slice(0, 400) || title,
    })
  }

  return { notes, tasks }
}

export function mergeExplicitContextIntoWorkspace(
  workspaceContext: AiWorkspaceContext | null,
  explicit: { notes: RetrievedNote[]; tasks: RetrievedTask[] },
): AiWorkspaceContext | null {
  if (!workspaceContext && explicit.notes.length === 0 && explicit.tasks.length === 0) {
    return null
  }

  const base: AiWorkspaceContext = workspaceContext ?? {
    spaceName: '',
    members: [],
    notes: [],
    tasks: [],
    linkedNote: null,
    citations: [],
  }

  const notes = mergeById(base.notes, explicit.notes)
  const tasks = mergeTasksById(base.tasks, explicit.tasks)

  const context: AiWorkspaceContext = {
    ...base,
    notes,
    tasks,
    citations: buildMergedCitations(base.citations, explicit),
  }

  return context
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return [...byId.values()]
}

function mergeTasksById(current: RetrievedTask[], incoming: RetrievedTask[]) {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return [...byId.values()]
}

function buildMergedCitations(
  current: AiWorkspaceCitation[],
  explicit: { notes: RetrievedNote[]; tasks: RetrievedTask[] },
) {
  const citations = [...current]

  for (const note of explicit.notes) {
    if (citations.some((item) => item.type === 'note' && item.id === note.id)) continue
    citations.push({ type: 'note', id: note.id, title: note.title })
  }

  for (const task of explicit.tasks) {
    if (citations.some((item) => item.type === 'task' && item.id === task.id)) continue
    citations.push({
      type: 'task',
      id: task.id,
      boardId: task.boardId,
      title: task.title,
      boardTitle: task.boardTitle,
    })
  }

  return citations
}
