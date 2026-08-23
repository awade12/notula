import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { databaseRows, databases } from '../../db/schema/databases'
import { pages } from '../../db/schema/pages'
import { spaces } from '../../db/schema/spaces'
import { listSpaceMembers } from '../spaces/members.service'
import { requireSpaceMembership } from '../spaces/permissions'
import {
  extractRetrievalTerms,
  isLaunchBlockerQuery,
} from './retrieval-query'
import {
  extractChecklistSectionItems,
  extractUncheckedChecklistItems,
} from './parse-checklist-items'
import { searchPages } from '../search/service'
import {
  readTaskDescriptionText,
  readTaskTitle,
  searchProjectTasks,
  toRetrievedTask,
} from '../search/task-search'

export { readTaskDescriptionText, readTaskTitle } from '../search/task-search'

export type RetrievedNote = {
  id: string
  title: string
  snippet: string
}

export type RetrievedTask = {
  id: string
  boardId: string
  title: string
  boardTitle: string
  snippet: string
}

export type LinkedNoteContext = {
  id: string
  title: string
  content: string
}

export type AiWorkspaceCitation =
  | { type: 'note'; id: string; title: string }
  | { type: 'task'; id: string; boardId: string; title: string; boardTitle: string }

export type AiContextRef =
  | { type: 'note'; id: string }
  | { type: 'task'; id: string; boardId: string }

export type AiWorkspaceContext = {
  spaceName: string
  members: Array<{ name: string; role: string }>
  notes: RetrievedNote[]
  tasks: RetrievedTask[]
  linkedNote: LinkedNoteContext | null
  citations: AiWorkspaceCitation[]
  launchBlockerSummary?: string
}

export type RetrieveAiWorkspaceContextInput = {
  spaceId: string
  userId: string
  query: string
  authSecret: string
  excludePageId?: string
  excludeTaskId?: string
  linkedPageId?: string
  noteLimit?: number
  taskLimit?: number
  enrichNotes?: boolean
}

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

function readTaskDescriptionSnippet(properties: Record<string, unknown>, maxLength = 240) {
  return readTaskDescriptionText(properties).slice(0, maxLength)
}

function mapTaskRow(row: {
  id: string
  boardId: string
  properties: Record<string, unknown>
  boardTitle: string
}): RetrievedTask {
  const title = readTaskTitle(row.properties)
  const description = readTaskDescriptionSnippet(row.properties)
  return toRetrievedTask({
    id: row.id,
    boardId: row.boardId,
    boardTitle: row.boardTitle,
    title,
    snippet: description || title,
    matchType: 'keyword',
    updatedAt: new Date(),
    score: 0.5,
  })
}

function readTaskStatus(properties: Record<string, unknown>) {
  const status = properties.status
  return typeof status === 'string' ? status : 'unknown'
}

function mergeResultsById<T extends { id: string }>(lists: T[][], limit: number) {
  const byId = new Map<string, T>()
  for (const list of lists) {
    for (const item of list) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item)
      }
    }
  }
  return [...byId.values()].slice(0, limit)
}

async function keywordSearchNotesByTerms(
  db: Db,
  spaceId: string,
  query: string,
  limit: number,
  excludePageId?: string,
): Promise<RetrievedNote[]> {
  const terms = extractRetrievalTerms(query)
  const searchTerms = terms.length > 0 ? terms : [query.trim()].filter(Boolean)
  if (searchTerms.length === 0) return []

  const termClauses = searchTerms.flatMap((term) => {
    const pattern = `%${escapeLikePattern(term)}%`
    return [ilike(pages.title, pattern), ilike(pages.plaintext, pattern)]
  })

  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      plaintext: pages.plaintext,
    })
    .from(pages)
    .where(
      and(
        eq(pages.spaceId, spaceId),
        eq(pages.kind, 'note'),
        or(...termClauses),
      ),
    )
    .limit(limit + (excludePageId ? 1 : 0))

  return rows
    .filter((row) => row.id !== excludePageId)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      title: row.title,
      snippet: row.plaintext.trim().slice(0, 240) || row.title,
    }))
}

async function loadLaunchRelatedNotes(db: Db, spaceId: string, limit: number) {
  const rows = await db
    .select({
      id: pages.id,
      title: pages.title,
      plaintext: pages.plaintext,
    })
    .from(pages)
    .where(
      and(
        eq(pages.spaceId, spaceId),
        eq(pages.kind, 'note'),
        or(
          ilike(pages.title, '%launch%'),
          ilike(pages.title, '%checklist%'),
          ilike(pages.plaintext, '%must ship%'),
        ),
      ),
    )
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    snippet: row.plaintext.trim().slice(0, 2800) || row.title,
  }))
}

export async function enrichRetrievedNotes(
  db: Db,
  spaceId: string,
  notes: RetrievedNote[],
  maxChars = 2800,
) {
  if (notes.length === 0) return notes

  const rows = await db
    .select({
      id: pages.id,
      plaintext: pages.plaintext,
    })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), inArray(pages.id, notes.map((note) => note.id))))

  const plaintextById = new Map(rows.map((row) => [row.id, row.plaintext]))

  return notes.map((note) => {
    const plaintext = plaintextById.get(note.id)?.trim()
    if (!plaintext) return note
    return {
      ...note,
      snippet: plaintext.slice(0, maxChars),
    }
  })
}

async function searchTasksForContext(
  db: Db,
  spaceId: string,
  userId: string,
  query: string,
  limit: number,
  authSecret: string,
  excludeTaskId?: string,
  includeOpenTasks = false,
) {
  const [hybridResults, openTasks] = await Promise.all([
    searchProjectTasks(db, spaceId, userId, query, {
      mode: 'hybrid',
      limit,
      authSecret,
      excludeTaskId,
    }).then((hits) => hits.map(toRetrievedTask)),
    includeOpenTasks
      ? loadOpenProjectTasks(db, spaceId, limit, excludeTaskId, true)
      : Promise.resolve([]),
  ])

  return mergeResultsById([openTasks, hybridResults], limit)
}

async function loadOpenProjectTasks(
  db: Db,
  spaceId: string,
  limit: number,
  excludeTaskId?: string,
  launchBoardOnly = false,
): Promise<RetrievedTask[]> {
  const rows = await db
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
        eq(databaseRows.spaceId, spaceId),
        eq(databases.isProjectBoard, true),
        sql`${databaseRows.properties} ->> 'status' IS DISTINCT FROM 'done'`,
        ...(launchBoardOnly ? [ilike(databases.title, '%launch%')] : []),
      ),
    )
    .limit(limit + (excludeTaskId ? 1 : 0))

  return rows
    .filter((row) => row.id !== excludeTaskId)
    .slice(0, limit)
    .map((row) => {
      const mapped = mapTaskRow(row)
      const status = readTaskStatus(row.properties)
      return {
        ...mapped,
        snippet: `[${status}] ${mapped.snippet}`,
      }
    })
}

async function searchNotesForContext(
  db: Db,
  spaceId: string,
  userId: string,
  query: string,
  limit: number,
  authSecret: string,
  excludePageId?: string,
  includeLaunchNotes = false,
) {
  const [hybridResults, keywordResults, launchNotes] = await Promise.all([
    searchPages(db, spaceId, userId, query, {
      mode: 'hybrid',
      limit,
      scope: 'notes',
      authSecret,
    }),
    keywordSearchNotesByTerms(db, spaceId, query, limit, excludePageId),
    includeLaunchNotes ? loadLaunchRelatedNotes(db, spaceId, 2) : Promise.resolve([]),
  ])

  const hybridNotes = hybridResults
    .filter((result) => result.id !== excludePageId)
    .map((result) => ({
      id: result.id,
      title: result.title,
      snippet: result.snippet,
    }))

  return mergeResultsById([launchNotes, hybridNotes, keywordResults], limit)
}

async function loadLinkedNote(
  db: Db,
  spaceId: string,
  linkedPageId: string,
): Promise<LinkedNoteContext | null> {
  const [page] = await db
    .select({
      id: pages.id,
      title: pages.title,
      plaintext: pages.plaintext,
    })
    .from(pages)
    .where(and(eq(pages.id, linkedPageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) return null

  return {
    id: page.id,
    title: page.title,
    content: page.plaintext.trim().slice(0, 6000),
  }
}

export function buildWorkspaceCitations(context: Pick<AiWorkspaceContext, 'notes' | 'tasks' | 'linkedNote'>) {
  const citations: AiWorkspaceCitation[] = []

  for (const note of context.notes) {
    citations.push({ type: 'note', id: note.id, title: note.title })
  }

  for (const task of context.tasks) {
    citations.push({
      type: 'task',
      id: task.id,
      boardId: task.boardId,
      title: task.title,
      boardTitle: task.boardTitle,
    })
  }

  if (context.linkedNote) {
    citations.push({
      type: 'note',
      id: context.linkedNote.id,
      title: context.linkedNote.title,
    })
  }

  return citations
}

function buildLaunchBlockerSummary(context: Pick<AiWorkspaceContext, 'notes' | 'tasks'>) {
  const parts: string[] = ['Structured launch blockers (use these IDs for citation links):']

  const checklistNotes = [...context.notes].sort((a, b) => {
    const aScore = /launch|checklist/i.test(a.title) ? 0 : 1
    const bScore = /launch|checklist/i.test(b.title) ? 0 : 1
    return aScore - bScore
  })

  for (const note of checklistNotes) {
    const mustShip = extractChecklistSectionItems(note.snippet, 'Must ship')
    const unchecked = extractUncheckedChecklistItems(note.snippet)
    const items = mustShip.length > 0 ? mustShip : unchecked
    if (items.length === 0) continue

    parts.push(`Checklist from [${note.title}](note:${note.id}):`)
    for (const item of items) {
      parts.push(`- [ ] ${item}`)
    }
  }

  if (context.tasks.length > 0) {
    parts.push('Open launch sprint tasks:')
    for (const task of context.tasks) {
      parts.push(
        `- [${task.title}](task:${task.boardId}/${task.id}) on [${task.boardTitle}]: ${task.snippet}`,
      )
    }
  }

  if (parts.length === 1) return undefined
  return parts.join('\n')
}

export async function retrieveAiWorkspaceContext(
  db: Db,
  input: RetrieveAiWorkspaceContextInput,
): Promise<AiWorkspaceContext> {
  await requireSpaceMembership(db, input.spaceId, input.userId)

  const [space] = await db
    .select({ name: spaces.name })
    .from(spaces)
    .where(eq(spaces.id, input.spaceId))
    .limit(1)

  if (!space) {
    throw new Error('Not found')
  }

  const noteLimit = input.noteLimit ?? 5
  const taskLimit = input.taskLimit ?? 4
  const query = input.query.trim()
  const launchBlockerQuery = isLaunchBlockerQuery(query)
  const enrichNotes = input.enrichNotes ?? true

  const [memberRows, noteResults, taskResults, linkedNote] = await Promise.all([
    listSpaceMembers(db, input.spaceId, input.userId),
    query.length >= 2
      ? searchNotesForContext(
          db,
          input.spaceId,
          input.userId,
          query,
          noteLimit + (input.excludePageId ? 1 : 0),
          input.authSecret,
          input.excludePageId,
          launchBlockerQuery,
        )
      : Promise.resolve([]),
    query.length >= 2
      ? searchTasksForContext(
          db,
          input.spaceId,
          input.userId,
          query,
          taskLimit,
          input.authSecret,
          input.excludeTaskId,
          launchBlockerQuery,
        )
      : Promise.resolve([]),
    input.linkedPageId
      ? loadLinkedNote(db, input.spaceId, input.linkedPageId)
      : Promise.resolve(null),
  ])

  let notes = noteResults
    .filter((result) => result.id !== input.excludePageId)
    .slice(0, noteLimit)

  if (enrichNotes && notes.length > 0) {
    notes = await enrichRetrievedNotes(db, input.spaceId, notes)
  }

  const context = {
    spaceName: space.name,
    members: memberRows.slice(0, 16).map((member) => ({
      name: member.name,
      role: member.role,
    })),
    notes,
    tasks: taskResults,
    linkedNote,
    citations: [] as AiWorkspaceCitation[],
    launchBlockerSummary: launchBlockerQuery
      ? buildLaunchBlockerSummary({ notes, tasks: taskResults })
      : undefined,
  }

  context.citations = buildWorkspaceCitations(context)

  return context
}

export function formatAiWorkspaceContext(context: AiWorkspaceContext) {
  const parts: string[] = [`Teamspace: ${context.spaceName}`]

  if (context.launchBlockerSummary) {
    parts.push(context.launchBlockerSummary)
  }

  if (context.members.length > 0) {
    const memberLine = context.members.map((member) => member.name).join(', ')
    parts.push(`Team members: ${memberLine}`)
  }

  if (context.notes.length > 0) {
    parts.push('Relevant notes in this teamspace (cite as [Title](note:ID)):')
    for (const note of context.notes) {
      parts.push(`- note:${note.id} | "${note.title}": ${note.snippet}`)
    }
  }

  if (context.tasks.length > 0) {
    parts.push('Relevant project tasks in this teamspace (cite as [Title](task:BOARD_ID/TASK_ID)):')
    for (const task of context.tasks) {
      parts.push(
        `- task:${task.boardId}/${task.id} | [${task.boardTitle}] ${task.title}: ${task.snippet}`,
      )
    }
  }

  if (context.linkedNote) {
    parts.push(
      `Linked note note:${context.linkedNote.id} | "${context.linkedNote.title}":\n${context.linkedNote.content || '(empty)'}`,
    )
  }

  return parts.join('\n')
}

export function buildRetrievalQuery(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n')
    .slice(0, 4000)
}
