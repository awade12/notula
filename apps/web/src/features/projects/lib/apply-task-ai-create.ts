import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import type { PropertyDefinition } from '@notesapp/shared'
import type { UseMutateAsyncFunction } from '@tanstack/react-query'
import type { DatabaseRow } from '@/features/database/types'
import { markdownToTaskDescriptionBlocks } from './markdown-to-task-description-blocks'
import { normalizeTaskAiMarkdown } from './normalize-task-ai-markdown'
import { serializeProjectTaskDescription } from './project-task-description-content'
import type { TaskAiCreateTask } from './task-ai-types'

type CreateRow = UseMutateAsyncFunction<
  { row: DatabaseRow },
  Error,
  { properties?: Record<string, unknown> } | undefined,
  unknown
>

function buildCreateProperties(
  create: TaskAiCreateTask,
  schemaProperties: PropertyDefinition[],
) {
  const properties: Record<string, unknown> = {
    [PROJECT_BOARD_PROPERTY_IDS.title]: create.title.trim(),
  }

  if (create.description?.trim()) {
    const normalized = normalizeTaskAiMarkdown(create.description)
    const blocks = markdownToTaskDescriptionBlocks(normalized)
    properties[PROJECT_BOARD_PROPERTY_IDS.description] = serializeProjectTaskDescription(blocks)
  }

  if (create.status) {
    const statusProperty = schemaProperties.find(
      (property) => property.id === PROJECT_BOARD_PROPERTY_IDS.status,
    )
    if (statusProperty?.type === 'select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.status] = create.status
    }
  }

  if (create.assigneeId !== undefined) {
    properties[PROJECT_BOARD_PROPERTY_IDS.assignee] = create.assigneeId
  }

  if (create.labelIds?.length) {
    const labelProperty = schemaProperties.find(
      (property) => property.id === PROJECT_BOARD_PROPERTY_IDS.label,
    )
    if (labelProperty?.type === 'multi_select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.label] = create.labelIds
    }
  }

  return properties
}

export async function applyTaskAiCreate(input: {
  create: TaskAiCreateTask
  schemaProperties: PropertyDefinition[]
  createRow: CreateRow
}) {
  const properties = buildCreateProperties(input.create, input.schemaProperties)
  await input.createRow({ properties })
}

export async function applyTaskAiCreates(input: {
  creates: TaskAiCreateTask[]
  schemaProperties: PropertyDefinition[]
  createRow: CreateRow
}) {
  for (const create of input.creates) {
    await applyTaskAiCreate({
      create,
      schemaProperties: input.schemaProperties,
      createRow: input.createRow,
    })
  }
}
