import type { PropertyDefinition } from '@notesapp/shared'
import { getPropertyLabel } from '@notesapp/shared'

export const ADD_PROPERTY_TYPES: PropertyDefinition['type'][] = [
  'text',
  'number',
  'select',
  'checkbox',
  'relation',
]

export const PROPERTY_TYPE_OPTIONS: {
  type: PropertyDefinition['type']
  label: string
  description: string
}[] = [
  { type: 'text', label: 'Text', description: 'Plain text' },
  { type: 'number', label: 'Number', description: 'Numbers and counts' },
  { type: 'select', label: 'Select', description: 'Choose one option' },
  { type: 'checkbox', label: 'Checkbox', description: 'True or false' },
  { type: 'relation', label: 'Relation', description: 'Link to other pages' },
]

function createPropertyId(name: string) {
  const baseId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24)
  const suffix = crypto.randomUUID().slice(0, 4)
  return baseId ? `${baseId}_${suffix}` : crypto.randomUUID().slice(0, 8)
}

export function createPropertyDefinition(
  type: PropertyDefinition['type'],
  name?: string,
): PropertyDefinition {
  const defaultName = name?.trim() || getPropertyLabel(type)
  const id = createPropertyId(defaultName)

  if (type === 'select') {
    return {
      id,
      name: defaultName,
      type: 'select',
      config: {
        options: [
          { id: 'todo', label: 'To do', color: 'gray' },
          { id: 'doing', label: 'In progress', color: 'blue' },
          { id: 'done', label: 'Done', color: 'green' },
        ],
      },
    }
  }

  if (type === 'relation') {
    return {
      id,
      name: defaultName,
      type: 'relation',
      config: { limit: 10 },
    }
  }

  return {
    id,
    name: defaultName,
    type,
  }
}
