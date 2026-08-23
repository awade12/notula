import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'

export function resolveDoneStatusId(groupProperty: PropertyDefinition | undefined) {
  if (groupProperty?.type !== 'select') return 'done'
  return groupProperty.config?.options?.find((option) => option.id === 'done')?.id ?? 'done'
}

export function isSubtaskDone(
  row: DatabaseRow,
  statusPropertyId: string,
  doneStatusId: string,
) {
  return row.properties[statusPropertyId] === doneStatusId
}

export function computeSubtaskProgress(
  subtasks: DatabaseRow[],
  statusPropertyId: string,
  doneStatusId: string,
) {
  if (subtasks.length === 0) {
    return { completed: 0, total: 0, percent: 0 }
  }

  const completed = subtasks.filter((row) =>
    isSubtaskDone(row, statusPropertyId, doneStatusId),
  ).length

  return {
    completed,
    total: subtasks.length,
    percent: Math.round((completed / subtasks.length) * 100),
  }
}

export function sortSubtasksForDisplay(
  subtasks: DatabaseRow[],
  statusPropertyId: string,
  doneStatusId: string,
  readTitle: (row: DatabaseRow) => string,
) {
  return [...subtasks].sort((left, right) => {
    const leftDone = isSubtaskDone(left, statusPropertyId, doneStatusId)
    const rightDone = isSubtaskDone(right, statusPropertyId, doneStatusId)
    if (leftDone !== rightDone) return leftDone ? 1 : -1
    return readTitle(left).localeCompare(readTitle(right))
  })
}
