import type { DatabaseRow } from '@/features/database/types'

export type CellFocus = { rowId: string; propertyId: string }

export type NavDirection = 'next' | 'prev' | 'down' | 'up'

export function getAdjacentCell(
  rows: DatabaseRow[],
  propertyIds: string[],
  current: CellFocus,
  direction: NavDirection,
): CellFocus | null {
  if (propertyIds.length === 0 || rows.length === 0) return null

  const rowIndex = rows.findIndex((row) => row.id === current.rowId)
  const propertyIndex = propertyIds.indexOf(current.propertyId)
  if (rowIndex === -1 || propertyIndex === -1) return null

  if (direction === 'next') {
    if (propertyIndex < propertyIds.length - 1) {
      return { rowId: current.rowId, propertyId: propertyIds[propertyIndex + 1]! }
    }
    if (rowIndex < rows.length - 1) {
      return { rowId: rows[rowIndex + 1]!.id, propertyId: propertyIds[0]! }
    }
    return null
  }

  if (direction === 'prev') {
    if (propertyIndex > 0) {
      return { rowId: current.rowId, propertyId: propertyIds[propertyIndex - 1]! }
    }
    if (rowIndex > 0) {
      return { rowId: rows[rowIndex - 1]!.id, propertyId: propertyIds[propertyIds.length - 1]! }
    }
    return null
  }

  if (direction === 'down') {
    if (rowIndex < rows.length - 1) {
      return { rowId: rows[rowIndex + 1]!.id, propertyId: current.propertyId }
    }
    return null
  }

  if (rowIndex > 0) {
    return { rowId: rows[rowIndex - 1]!.id, propertyId: current.propertyId }
  }
  return null
}
