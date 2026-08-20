import type { DatabaseRow } from '@/features/database/types'
import type { PropertyDefinition } from '@notesapp/shared'
import { normalizeMultiSelectValue } from '@notesapp/shared'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { projectTaskDescriptionToPlainText } from './project-task-description-content'

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

export function buildProjectTaskContext(input: {
  row: DatabaseRow
  titlePropertyId: string
  statusProperty?: PropertyDefinition
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  estimatePropertyId?: string
  members: SpaceMember[]
}) {
  const {
    row,
    titlePropertyId,
    statusProperty,
    labelProperty,
    milestoneProperty,
    priorityProperty,
    estimatePropertyId = 'estimate',
    members,
  } = input
  const title = readText(row.properties, titlePropertyId)
  const status = readSelectLabel(statusProperty, row.properties[statusProperty?.id ?? ''])
  const labels =
    labelProperty?.type === 'multi_select'
      ? readMultiSelectLabels(labelProperty, row.properties[labelProperty.id])
      : readSelectLabel(labelProperty, row.properties[labelProperty?.id ?? ''])
  const milestone = readSelectLabel(milestoneProperty, row.properties[milestoneProperty?.id ?? ''])
  const priority = readSelectLabel(priorityProperty, row.properties[priorityProperty?.id ?? ''])
  const estimate = readNumber(row.properties, estimatePropertyId)
  const dueDate = readText(row.properties, 'due_date')
  const description = projectTaskDescriptionToPlainText(row.properties.description)
  const assigneeId = readText(row.properties, 'assignee')
  const assignee = members.find((member) => member.userId === assigneeId)

  const lines = [
    `Task: ${title || 'Untitled'}`,
    description ? `Description:\n${description}` : null,
    status ? `Status: ${status}` : null,
    labels ? `Labels: ${labels}` : null,
    priority ? `Priority: ${priority}` : null,
    milestone ? `Milestone: ${milestone}` : null,
    estimate !== null ? `Estimate: ${estimate} points` : null,
    dueDate ? `Due date: ${dueDate}` : null,
    assignee ? `Assignee: ${assignee.name}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export const PROJECT_TASK_AI_ACTIONS = [
  {
    id: 'breakdown' as const,
    label: 'Break down',
    prompt: 'Break this task into a short checklist and add it to the description.',
  },
  {
    id: 'acceptance' as const,
    label: 'Acceptance criteria',
    prompt: 'Write concise acceptance criteria and add them to the description.',
  },
  {
    id: 'next' as const,
    label: 'Next steps',
    prompt: 'Suggest the most important next steps and add them to the description.',
  },
]
