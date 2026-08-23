import { normalizeAssigneeValue, normalizeMultiSelectValue } from '@notesapp/shared'
import type { PropertyDefinition } from '@notesapp/shared'
import type { TaskActivityItem } from '../hooks/use-task-activity'

function readOptionLabel(property: PropertyDefinition | undefined, value: unknown) {
  if (!property || typeof value !== 'string') return formatScalar(value)
  return property.config?.options?.find((option) => option.id === value)?.label ?? value
}

function readMultiOptionLabels(property: PropertyDefinition | undefined, value: unknown) {
  if (!property) return formatScalar(value)
  const ids = normalizeMultiSelectValue(value)
  if (ids.length === 0) return 'Empty'
  const options = property.config?.options ?? []
  return ids
    .map((id) => options.find((option) => option.id === id)?.label ?? id)
    .join(', ')
}

function readAssigneeLabels(
  members: Array<{ userId: string; name: string }>,
  value: unknown,
) {
  const ids = normalizeAssigneeValue(value)
  if (ids.length === 0) return 'Unassigned'
  return ids
    .map((id) => members.find((member) => member.userId === id)?.name ?? id)
    .join(', ')
}

function formatScalar(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Empty'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Empty'
  return JSON.stringify(value)
}

function readMetadataValue(metadata: TaskActivityItem['metadata'], key: string) {
  if (!metadata || !(key in metadata)) return undefined
  return metadata[key]
}

export function formatTaskActivityBody(
  item: TaskActivityItem,
  properties: PropertyDefinition[],
  members: Array<{ userId: string; name: string }> = [],
) {
  if (item.kind === 'comment' || item.kind === 'created') return item.body

  const propertyId =
    typeof item.metadata?.propertyId === 'string' ? item.metadata.propertyId : undefined
  const property = propertyId
    ? properties.find((entry) => entry.id === propertyId)
    : undefined
  const from = readMetadataValue(item.metadata, 'from')
  const to = readMetadataValue(item.metadata, 'to')

  if (item.metadata?.subtaskTitle && typeof item.metadata.subtaskTitle === 'string') {
    return item.body
  }

  if (property && from !== undefined && to !== undefined) {
    if (property.id === 'assignee') {
      return `Assignees: ${readAssigneeLabels(members, from)} → ${readAssigneeLabels(members, to)}`
    }
    if (property.type === 'select') {
      return `${property.name}: ${readOptionLabel(property, from)} → ${readOptionLabel(property, to)}`
    }
    if (property.type === 'multi_select') {
      return `${property.name}: ${readMultiOptionLabels(property, from)} → ${readMultiOptionLabels(property, to)}`
    }
    return `${property.name}: ${formatScalar(from)} → ${formatScalar(to)}`
  }

  return item.body
}
