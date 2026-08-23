import type { DatabaseRow } from '@/features/database/types'
import { countSubtasks, filterSubtasks, readParentTaskId } from './filter-top-level-tasks'

export function listLinkableSubtaskCandidates(rows: DatabaseRow[], parentTaskId: string) {
  const existingSubtaskIds = new Set(filterSubtasks(rows, parentTaskId).map((row) => row.id))

  return rows.filter((row) => {
    if (row.id === parentTaskId) return false
    if (existingSubtaskIds.has(row.id)) return false
    if (readParentTaskId(row.properties)) return false
    if (countSubtasks(rows, row.id) > 0) return false
    return true
  })
}
