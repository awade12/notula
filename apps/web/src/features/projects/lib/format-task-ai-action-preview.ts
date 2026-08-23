import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { normalizeTaskAiMarkdown } from './normalize-task-ai-markdown'
import { projectTaskDescriptionToPlainText } from './project-task-description-content'
import type { TaskAiAction, TaskAiMember, TaskAiProperty } from './task-ai-types'

export type TaskAiActionPreview = {
  fieldName: string
  summary: string
  plainPreview: string
  markdownPreview?: string
}

function readSelectLabel(property: TaskAiProperty, value: unknown) {
  if (value === null || value === undefined || value === '') return '(clear)'
  if (typeof value !== 'string') return String(value)
  return property.options?.find((option) => option.id === value)?.label ?? value
}

function readMultiSelectLabels(property: TaskAiProperty, value: unknown) {
  const ids = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  if (ids.length === 0) return '(clear)'
  return ids
    .map((id) => property.options?.find((option) => option.id === id)?.label ?? id)
    .join(', ')
}

function readAssigneeLabel(members: TaskAiMember[], value: unknown) {
  if (value === null || value === undefined || value === '') return 'Unassigned'
  if (typeof value !== 'string') return String(value)
  return members.find((member) => member.userId === value)?.name ?? value
}

function readDescriptionPreview(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return { plain: '(empty)', markdown: undefined }

  const normalized = normalizeTaskAiMarkdown(value)
  const plain = projectTaskDescriptionToPlainText(normalized) || normalized.trim()
  const looksLikeMarkdown = /(^|\n)\s{0,3}(#{1,6}\s|[-*]\s|\d+\.\s|- \[[ xX]\])/.test(normalized)

  return {
    plain,
    markdown: looksLikeMarkdown ? normalized : undefined,
  }
}

export function formatTaskAiActionPreview(input: {
  action: TaskAiAction
  properties: TaskAiProperty[]
  members?: TaskAiMember[]
}): TaskAiActionPreview {
  const property = input.properties.find((item) => item.id === input.action.propertyId)
  const fieldName = property?.name ?? input.action.propertyId
  const members = input.members ?? []

  if (input.action.propertyId === PROJECT_BOARD_PROPERTY_IDS.description) {
    const { plain, markdown } = readDescriptionPreview(input.action.value)
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: plain,
      markdownPreview: markdown,
    }
  }

  if (!property) {
    const fallback =
      typeof input.action.value === 'string'
        ? input.action.value
        : JSON.stringify(input.action.value)
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: fallback,
    }
  }

  if (property.type === 'select') {
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: readSelectLabel(property, input.action.value),
    }
  }

  if (property.type === 'multi_select') {
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: readMultiSelectLabels(property, input.action.value),
    }
  }

  if (property.id === PROJECT_BOARD_PROPERTY_IDS.assignee) {
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: readAssigneeLabel(members, input.action.value),
    }
  }

  if (property.type === 'number') {
    const value = input.action.value
    return {
      fieldName,
      summary: input.action.summary,
      plainPreview: value === null || value === undefined ? '(clear)' : String(value),
    }
  }

  const textValue = input.action.value
  return {
    fieldName,
    summary: input.action.summary,
    plainPreview:
      typeof textValue === 'string'
        ? textValue.trim() || '(clear)'
        : textValue === null || textValue === undefined
          ? '(clear)'
          : String(textValue),
  }
}

export function isLongTaskAiPreview(preview: TaskAiActionPreview) {
  const content = preview.markdownPreview ?? preview.plainPreview
  return content.length > 260 || content.split('\n').length > 7
}
