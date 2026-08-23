import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'

export function readTaskTitleFromRow(row: DatabaseRow, titlePropertyId = PROJECT_BOARD_PROPERTY_IDS.title) {
  const value = row.properties[titlePropertyId]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Untitled'
}
