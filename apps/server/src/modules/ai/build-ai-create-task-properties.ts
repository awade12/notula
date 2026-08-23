import {
  findProperty,
  normalizeAssigneeValue,
  parseCellValue,
  PROJECT_BOARD_PROPERTY_IDS,
  type DatabaseSchema,
} from '@notesapp/shared'
import type { z } from 'zod'
import type { taskAiCreateTaskSchema } from './task-agent.service'

type AiCreateTask = z.infer<typeof taskAiCreateTaskSchema>

export function buildAiCreateTaskProperties(
  task: AiCreateTask,
  schema: DatabaseSchema,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    [PROJECT_BOARD_PROPERTY_IDS.title]: task.title.trim(),
  }

  const descriptionProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.description)
  if (task.description?.trim() && descriptionProperty) {
    properties[PROJECT_BOARD_PROPERTY_IDS.description] = parseCellValue(
      descriptionProperty,
      task.description.trim(),
    )
  }

  if (task.status) {
    const statusProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.status)
    if (statusProperty?.type === 'select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.status] = parseCellValue(statusProperty, task.status)
    }
  }

  const assigneeIds = normalizeAssigneeValue(task.assigneeIds ?? task.assigneeId ?? null)
  if (
    assigneeIds.length > 0 ||
    task.assigneeIds !== undefined ||
    task.assigneeId !== undefined
  ) {
    const assigneeProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.assignee)
    if (assigneeProperty) {
      properties[PROJECT_BOARD_PROPERTY_IDS.assignee] = parseCellValue(assigneeProperty, assigneeIds)
    }
  }

  if (task.labelIds?.length) {
    const labelProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.label)
    if (labelProperty?.type === 'multi_select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.label] = parseCellValue(labelProperty, task.labelIds)
    }
  }

  if (task.milestone) {
    const milestoneProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.milestone)
    if (milestoneProperty?.type === 'select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.milestone] = parseCellValue(
        milestoneProperty,
        task.milestone,
      )
    }
  }

  if (task.priority) {
    const priorityProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.priority)
    if (priorityProperty?.type === 'select') {
      properties[PROJECT_BOARD_PROPERTY_IDS.priority] = parseCellValue(
        priorityProperty,
        task.priority,
      )
    }
  }

  if (task.estimate !== undefined && task.estimate !== null) {
    const estimateProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.estimate)
    if (estimateProperty?.type === 'number') {
      properties[PROJECT_BOARD_PROPERTY_IDS.estimate] = parseCellValue(
        estimateProperty,
        task.estimate,
      )
    }
  }

  if (task.dueDate?.trim()) {
    const dueDateProperty = findProperty(schema.properties, PROJECT_BOARD_PROPERTY_IDS.dueDate)
    if (dueDateProperty?.type === 'text') {
      properties[PROJECT_BOARD_PROPERTY_IDS.dueDate] = parseCellValue(
        dueDateProperty,
        task.dueDate.trim(),
      )
    }
  }

  return properties
}
