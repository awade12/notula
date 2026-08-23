import { and, eq } from 'drizzle-orm'
import {
  findProperty,
  normalizeMultiSelectValue,
  PROJECT_BOARD_PROPERTY_IDS,
  type DatabaseSchema,
  type PropertyDefinition,
} from '@notesapp/shared'
import type { Db } from '../../db/client'
import { databaseRows } from '../../db/schema/databases'
import { pages } from '../../db/schema/pages'
import * as databasesService from '../databases/service'
import { listSpaceMembers } from '../spaces/members.service'
import { readTaskDescriptionText, readTaskTitle } from '../search/task-search'
import type { TaskAgentRequest } from './task-agent.service'

type TaskAiProperty = TaskAgentRequest['properties'][number]

const EDITABLE_PROPERTY_IDS = new Set<string>([
  PROJECT_BOARD_PROPERTY_IDS.title,
  PROJECT_BOARD_PROPERTY_IDS.description,
  PROJECT_BOARD_PROPERTY_IDS.status,
  PROJECT_BOARD_PROPERTY_IDS.label,
  PROJECT_BOARD_PROPERTY_IDS.milestone,
  PROJECT_BOARD_PROPERTY_IDS.priority,
  PROJECT_BOARD_PROPERTY_IDS.estimate,
  PROJECT_BOARD_PROPERTY_IDS.dueDate,
  PROJECT_BOARD_PROPERTY_IDS.assignee,
])

function readText(properties: Record<string, unknown>, propertyId: string) {
  const value = properties[propertyId]
  return typeof value === 'string' ? value : ''
}

function readSelectLabel(property: PropertyDefinition | undefined, value: unknown) {
  if (!property || typeof value !== 'string') return null
  return property.config?.options?.find((option) => option.id === value)?.label ?? null
}

function readMultiSelectLabels(property: PropertyDefinition | undefined, value: unknown) {
  if (!property) return null
  const ids = normalizeMultiSelectValue(value)
  if (ids.length === 0) return null
  const options = property.config?.options ?? []
  const labels = ids
    .map((id) => options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label))
  return labels.length > 0 ? labels.join(', ') : null
}

function readNumber(properties: Record<string, unknown>, propertyId: string) {
  const value = properties[propertyId]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function buildTaskContextFromRow(input: {
  taskId: string
  properties: Record<string, unknown>
  boardTitle: string
  schema: DatabaseSchema
  members: Array<{ userId: string; name: string }>
  linkedNote?: { title: string; content: string } | null
}) {
  const { taskId, properties, boardTitle, schema, members } = input
  const statusProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.status)
  const labelProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.label)
  const milestoneProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.milestone)
  const priorityProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.priority)

  const title = readTaskTitle(properties)
  const description = readTaskDescriptionText(properties)
  const status = readSelectLabel(statusProperty, properties[PROJECT_BOARD_PROPERTY_IDS.status])
  const labels =
    labelProperty?.type === 'multi_select'
      ? readMultiSelectLabels(labelProperty, properties[labelProperty.id])
      : labelProperty
        ? readSelectLabel(labelProperty, properties[labelProperty.id])
        : null
  const milestone = readSelectLabel(milestoneProperty, properties[PROJECT_BOARD_PROPERTY_IDS.milestone])
  const priority = readSelectLabel(priorityProperty, properties[PROJECT_BOARD_PROPERTY_IDS.priority])
  const estimate = readNumber(properties, PROJECT_BOARD_PROPERTY_IDS.estimate)
  const dueDate = readText(properties, PROJECT_BOARD_PROPERTY_IDS.dueDate)
  const assigneeId = readText(properties, PROJECT_BOARD_PROPERTY_IDS.assignee)
  const assignee = members.find((member) => member.userId === assigneeId)

  const lines = [
    `Board: ${boardTitle}`,
    `Task ID: ${taskId}`,
    `Title: ${title.trim() || 'Untitled'}`,
    description
      ? `Description:\n${description.slice(0, 16000)}`
      : 'Description: (empty — user has not written one yet)',
    status ? `Status: ${status}` : 'Status: (not set)',
    labels ? `Labels: ${labels}` : null,
    priority ? `Priority: ${priority}` : null,
    milestone ? `Milestone: ${milestone}` : null,
    estimate !== null ? `Estimate: ${estimate} points` : null,
    dueDate ? `Due date: ${dueDate}` : null,
    assignee ? `Assignee: ${assignee.name}` : null,
    input.linkedNote
      ? `Linked doc "${input.linkedNote.title}":\n${input.linkedNote.content.slice(0, 6000) || '(empty)'}`
      : null,
  ].filter(Boolean)

  return lines.join('\n')
}

async function loadLinkedNoteForTask(
  db: Db,
  spaceId: string,
  linkedPageId: string,
): Promise<{ title: string; content: string } | null> {
  const [page] = await db
    .select({
      title: pages.title,
      plaintext: pages.plaintext,
    })
    .from(pages)
    .where(and(eq(pages.id, linkedPageId), eq(pages.spaceId, spaceId)))
    .limit(1)

  if (!page) return null

  return {
    title: page.title,
    content: page.plaintext.trim(),
  }
}

export function buildTaskAiPropertiesFromSchema(properties: PropertyDefinition[]): TaskAiProperty[] {
  const result: TaskAiProperty[] = []

  for (const property of properties) {
    if (!EDITABLE_PROPERTY_IDS.has(property.id)) continue

    if (property.type === 'text' || property.type === 'number') {
      result.push({ id: property.id, name: property.name, type: property.type })
      continue
    }

    if (property.type === 'select' || property.type === 'multi_select') {
      result.push({
        id: property.id,
        name: property.name,
        type: property.type,
        options: property.config?.options?.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      })
    }
  }

  return result
}

export async function hydrateTaskAgentRequest(
  db: Db,
  userId: string,
  input: TaskAgentRequest,
): Promise<TaskAgentRequest> {
  if (!input.spaceId || !input.boardId || !input.taskId) {
    return input
  }

  try {
    const [database, members] = await Promise.all([
      databasesService.getDatabase(db, input.spaceId, input.boardId, userId),
      listSpaceMembers(db, input.spaceId, userId),
    ])

    const [row] = await db
      .select({
        id: databaseRows.id,
        properties: databaseRows.properties,
      })
      .from(databaseRows)
      .where(
        and(
          eq(databaseRows.id, input.taskId),
          eq(databaseRows.databaseId, input.boardId),
          eq(databaseRows.spaceId, input.spaceId),
        ),
      )
      .limit(1)

    if (!row) return input

    const memberSummaries = members.map((member) => ({
      userId: member.userId,
      name: member.name,
    }))

    const properties = buildTaskAiPropertiesFromSchema(database.schema.properties)
    const linkedNote =
      input.linkedPageId && input.spaceId
        ? await loadLinkedNoteForTask(db, input.spaceId, input.linkedPageId)
        : null

    return {
      ...input,
      taskTitle: readTaskTitle(row.properties),
      taskContext: buildTaskContextFromRow({
        taskId: row.id,
        properties: row.properties,
        boardTitle: database.title,
        schema: database.schema,
        members: memberSummaries,
        linkedNote,
      }),
      properties: properties.length > 0 ? properties : input.properties,
      members: memberSummaries,
    }
  } catch {
    return input
  }
}
