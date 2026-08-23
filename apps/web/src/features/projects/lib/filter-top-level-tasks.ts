import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'

export function readParentTaskId(properties: Record<string, unknown>) {
  const value = properties[PROJECT_BOARD_PROPERTY_IDS.parentTask]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function filterTopLevelTasks(rows: DatabaseRow[]) {
  return rows.filter((row) => !readParentTaskId(row.properties))
}

export function filterSubtasks(rows: DatabaseRow[], parentTaskId: string) {
  return rows.filter((row) => readParentTaskId(row.properties) === parentTaskId)
}

export function countSubtasks(rows: DatabaseRow[], parentTaskId: string) {
  return filterSubtasks(rows, parentTaskId).length
}
