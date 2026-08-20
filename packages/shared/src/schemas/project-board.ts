import type { DatabaseSchema, PropertyDefinition, SelectOption } from './database'

export const PROJECT_BOARD_PROPERTY_IDS = {
  title: 'title',
  description: 'description',
  status: 'status',
  label: 'label',
  milestone: 'milestone',
  priority: 'priority',
  estimate: 'estimate',
  dueDate: 'due_date',
  assignee: 'assignee',
  linkedNote: 'linked_note',
} as const

export const DEFAULT_PROJECT_LABELS: SelectOption[] = [
  { id: 'bug', label: 'Bug', color: 'red' },
  { id: 'feature', label: 'Feature', color: 'blue' },
  { id: 'improvement', label: 'Improvement', color: 'purple' },
  { id: 'chore', label: 'Chore', color: 'gray' },
  { id: 'design', label: 'Design', color: 'yellow' },
  { id: 'docs', label: 'Docs', color: 'green' },
  { id: 'spike', label: 'Spike', color: 'yellow' },
  { id: 'tech-debt', label: 'Tech debt', color: 'red' },
  { id: 'qa', label: 'QA', color: 'purple' },
  { id: 'release', label: 'Release', color: 'green' },
  { id: 'security', label: 'Security', color: 'red' },
]

export const DEFAULT_PROJECT_MILESTONES: SelectOption[] = [
  { id: 'backlog', label: 'Backlog', color: 'gray' },
  { id: 'v1-4-5', label: 'v1.4.5', color: 'blue' },
  { id: 'v1-5-0', label: 'v1.5.0', color: 'green' },
  { id: 'v1-6-0', label: 'v1.6.0', color: 'purple' },
]

export const DEFAULT_PROJECT_PRIORITIES: SelectOption[] = [
  { id: 'low', label: 'Low', color: 'gray' },
  { id: 'medium', label: 'Medium', color: 'blue' },
  { id: 'high', label: 'High', color: 'yellow' },
  { id: 'urgent', label: 'Urgent', color: 'red' },
]

const PROJECT_BOARD_EXTRA_PROPERTIES: PropertyDefinition[] = [
  { id: PROJECT_BOARD_PROPERTY_IDS.description, name: 'Description', type: 'text' },
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
  { id: PROJECT_BOARD_PROPERTY_IDS.estimate, name: 'Estimate', type: 'number' },
  { id: PROJECT_BOARD_PROPERTY_IDS.dueDate, name: 'Due date', type: 'text' },
  { id: PROJECT_BOARD_PROPERTY_IDS.assignee, name: 'Assignee', type: 'text' },
]

export function normalizeMultiSelectValue(value: unknown): string[] {
  if (value === null || value === undefined || value === '') return []
  if (typeof value === 'string') return [value]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function mergeSelectOptions(existing: SelectOption[] | undefined, defaults: SelectOption[]) {
  const ids = new Set((existing ?? []).map((option) => option.id))
  const appended = defaults.filter((option) => !ids.has(option.id))
  if (appended.length === 0) return existing ?? defaults
  return [...(existing ?? []), ...appended]
}

function mergeSelectPropertyOptions(
  property: PropertyDefinition,
  defaults: SelectOption[],
): PropertyDefinition {
  if (property.type !== 'select' && property.type !== 'multi_select') return property
  return {
    ...property,
    config: {
      ...property.config,
      options: mergeSelectOptions(property.config?.options, defaults),
    },
  }
}

function upgradeLabelProperty(property: PropertyDefinition): PropertyDefinition {
  if (property.id !== PROJECT_BOARD_PROPERTY_IDS.label) return property
  if (property.type === 'multi_select') {
    return { ...property, name: 'Labels' }
  }
  if (property.type === 'select') {
    return {
      ...property,
      name: 'Labels',
      type: 'multi_select',
      config: {
        ...property.config,
        options: property.config?.options ?? DEFAULT_PROJECT_LABELS,
        limit: property.config?.limit ?? 8,
      },
    }
  }
  return property
}

export function slugifyBoardPublicSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function mergeProjectBoardSchema(schema: DatabaseSchema): DatabaseSchema {
  const existingIds = new Set(schema.properties.map((property) => property.id))
  const appended = PROJECT_BOARD_EXTRA_PROPERTIES.filter((property) => !existingIds.has(property.id))

  const properties = [...schema.properties, ...appended].map((property) => {
    const upgraded = upgradeLabelProperty(property)
    if (upgraded.id === PROJECT_BOARD_PROPERTY_IDS.label) {
      return mergeSelectPropertyOptions(upgraded, DEFAULT_PROJECT_LABELS)
    }
    if (upgraded.id === PROJECT_BOARD_PROPERTY_IDS.milestone) {
      return mergeSelectPropertyOptions(upgraded, DEFAULT_PROJECT_MILESTONES)
    }
    if (upgraded.id === PROJECT_BOARD_PROPERTY_IDS.priority) {
      return mergeSelectPropertyOptions(upgraded, DEFAULT_PROJECT_PRIORITIES)
    }
    return upgraded
  })

  return { properties }
}

export function projectBoardSchemaNeedsMerge(schema: DatabaseSchema): boolean {
  const merged = mergeProjectBoardSchema(schema)
  return JSON.stringify(merged) !== JSON.stringify(schema)
}
