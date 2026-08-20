import { parseCellValue, type PropertyDefinition } from '@notesapp/shared'
import type { UseMutateAsyncFunction } from '@tanstack/react-query'
import type { TaskAiAction } from './task-ai-types'
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
    const blocks = parseProjectTaskDescription(value)
    return serializeProjectTaskDescription(blocks ?? [{ type: 'paragraph', content: value }])
  }

  if (property.type === 'select' && value === null) return null
  if (property.type === 'multi_select' && (value === null || value === undefined)) return []
  if (property.type === 'number' && value === null) return null
  if (property.type === 'text' && value === null) return ''

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
