import { parseCellValue, normalizeAssigneeValue, type PropertyDefinition } from '@notesapp/shared'
import type { UseMutateAsyncFunction } from '@tanstack/react-query'
import type { TaskAiAction } from './task-ai-types'
import { markdownToTaskDescriptionBlocks } from './markdown-to-task-description-blocks'
import { normalizeTaskAiMarkdown } from './normalize-task-ai-markdown'
import {
  parseProjectTaskDescription,
  serializeProjectTaskDescription,
} from './project-task-description-content'

type UpdateCell = UseMutateAsyncFunction<
  {
    id: string
    propertyId: string
    value: unknown
    properties: Record<string, unknown>
  },
  Error,
  { rowId: string; propertyId: string; value: unknown },
  unknown
>

function normalizeAiValue(property: PropertyDefinition, value: unknown) {
  if (property.id === 'description' && typeof value === 'string') {
    const normalized = normalizeTaskAiMarkdown(value)
    if (!normalized) return ''

    const looksLikeMarkdown = /(^|\n)\s{0,3}(#{1,6}\s|[-*]\s|\d+\.\s)/.test(normalized)
    const blocks = looksLikeMarkdown
      ? markdownToTaskDescriptionBlocks(normalized)
      : (parseProjectTaskDescription(normalized) ?? [{ type: 'paragraph', content: normalized }])

    return serializeProjectTaskDescription(blocks)
  }

  if (property.type === 'select' && value === null) return null
  if (property.type === 'multi_select' && (value === null || value === undefined)) return []
  if (property.type === 'number' && value === null) return null
  if (property.type === 'text' && value === null) return ''

  if (property.type === 'relation') {
    if (value === null || value === undefined || value === '') return []
    if (typeof value === 'string') return normalizeAssigneeValue(value)
    if (Array.isArray(value)) return normalizeAssigneeValue(value)
    return []
  }

  return parseCellValue(property, value)
}

export async function applyTaskAiAction(input: {
  action: TaskAiAction
  rowId: string
  properties: PropertyDefinition[]
  updateCell: UpdateCell
}) {
  const property = input.properties.find((item) => item.id === input.action.propertyId)
  if (!property) {
    throw new Error(`Unknown property: ${input.action.propertyId}`)
  }

  const value = normalizeAiValue(property, input.action.value)

  await input.updateCell({
    rowId: input.rowId,
    propertyId: property.id,
    value,
  })
}

export async function applyTaskAiActions(input: {
  actions: TaskAiAction[]
  rowId: string
  properties: PropertyDefinition[]
  updateCell: UpdateCell
}) {
  for (const action of input.actions) {
    await applyTaskAiAction({
      action,
      rowId: input.rowId,
      properties: input.properties,
      updateCell: input.updateCell,
    })
  }
}
