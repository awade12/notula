import { z } from 'zod'
import {
  DEFAULT_PROJECT_LABELS,
  DEFAULT_PROJECT_MILESTONES,
  DEFAULT_PROJECT_PRIORITIES,
  PROJECT_BOARD_PROPERTY_IDS,
} from './project-board'

export const selectOptionSchema = z.object({
  id: z.string(),
  label: z.string().max(100),
  color: z.string().max(32).optional(),
})

export const propertyDefinitionSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'checkbox', 'select', 'multi_select', 'relation']),
  config: z
    .object({
      options: z.array(selectOptionSchema).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .optional(),
})

export const databaseSchemaSchema = z.object({
  properties: z.array(propertyDefinitionSchema).min(1).max(50),
})

export type SelectOption = z.infer<typeof selectOptionSchema>
export type PropertyDefinition = z.infer<typeof propertyDefinitionSchema>
export type DatabaseSchema = z.infer<typeof databaseSchemaSchema>

export const DEFAULT_DATABASE_SCHEMA: DatabaseSchema = {
  properties: [{ id: 'title', name: 'Name', type: 'text' }],
}

export const DEFAULT_SELECT_SCHEMA: DatabaseSchema = {
  properties: [
    { id: 'title', name: 'Name', type: 'text' },
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        options: [
          { id: 'todo', label: 'To do', color: 'gray' },
          { id: 'doing', label: 'In progress', color: 'blue' },
          { id: 'done', label: 'Done', color: 'green' },
        ],
      },
    },
  ],
}

export const PROJECT_BOARD_SCHEMA: DatabaseSchema = {
  properties: [
    { id: PROJECT_BOARD_PROPERTY_IDS.title, name: 'Task', type: 'text' },
    { id: PROJECT_BOARD_PROPERTY_IDS.description, name: 'Description', type: 'text' },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.status,
      name: 'Status',
      type: 'select',
      config: {
        options: [
          { id: 'backlog', label: 'Backlog', color: 'gray' },
          { id: 'todo', label: 'To do', color: 'blue' },
          { id: 'doing', label: 'In progress', color: 'yellow' },
          { id: 'done', label: 'Done', color: 'green' },
        ],
      },
    },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.label,
      name: 'Labels',
      type: 'multi_select',
      config: { options: DEFAULT_PROJECT_LABELS, limit: 8 },
    },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.milestone,
      name: 'Milestone',
      type: 'select',
      config: { options: DEFAULT_PROJECT_MILESTONES },
    },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.priority,
      name: 'Priority',
      type: 'select',
      config: { options: DEFAULT_PROJECT_PRIORITIES },
    },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.estimate,
      name: 'Estimate',
      type: 'number',
    },
    { id: PROJECT_BOARD_PROPERTY_IDS.dueDate, name: 'Due date', type: 'text' },
    { id: PROJECT_BOARD_PROPERTY_IDS.assignee, name: 'Assignee', type: 'text' },
    {
      id: PROJECT_BOARD_PROPERTY_IDS.linkedNote,
      name: 'Note',
      type: 'relation',
      config: { limit: 1 },
    },
  ],
}

export function createDefaultRowValues(schema: DatabaseSchema): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const property of schema.properties) {
    switch (property.type) {
      case 'text':
        values[property.id] = ''
        break
      case 'number':
        values[property.id] = null
        break
      case 'checkbox':
        values[property.id] = false
        break
      case 'select':
        values[property.id] = null
        break
      case 'multi_select':
        values[property.id] = []
        break
      case 'relation':
        values[property.id] = []
        break
    }
  }

  return values
}
