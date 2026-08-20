import type { PropertyDefinition } from '@notesapp/shared'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import type { TaskAiProperty } from './task-ai-types'

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

function toTaskAiProperty(property: PropertyDefinition): TaskAiProperty | null {
  if (!EDITABLE_PROPERTY_IDS.has(property.id)) return null

  if (property.type === 'text' || property.type === 'number') {
    return { id: property.id, name: property.name, type: property.type }
  }

  if (property.type === 'select' || property.type === 'multi_select') {
    return {
      id: property.id,
      name: property.name,
      type: property.type,
      options: property.config?.options?.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    }
  }

  return null
}

export function buildTaskAiPropertySchema(properties: PropertyDefinition[]) {
  return properties
    .map(toTaskAiProperty)
    .filter((property): property is TaskAiProperty => property !== null)
}
