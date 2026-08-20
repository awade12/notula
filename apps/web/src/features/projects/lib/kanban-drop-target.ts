import type { DatabaseRow } from '@/features/database/types'
import type { BoardGroup } from '@/features/database/lib/group-rows'

export type KanbanMoveInput = {
  statusPropertyId?: string
  statusValue?: unknown
  beforeId?: string | null
  afterId?: string | null
}

export type KanbanCardDropPlacement = 'before' | 'after'

export type ProjectKanbanDropTarget = {
  columnId: string
  beforeRowId?: string
  afterRowId?: string
}

export function resolveKanbanCardDropPlacement(
  clientY: number,
  top: number,
  height: number,
  previous: KanbanCardDropPlacement | null = null,
): KanbanCardDropPlacement {
  const ratio = height > 0 ? (clientY - top) / height : 0.5
  const next: KanbanCardDropPlacement = ratio < 0.5 ? 'before' : 'after'

  if (!previous || previous === next) return next
  if (previous === 'before' && ratio < 0.55) return 'before'
  if (previous === 'after' && ratio > 0.45) return 'after'
  return next
}

export function buildKanbanDropTarget(
  columnId: string,
  rowId: string,
  placement: KanbanCardDropPlacement,
): ProjectKanbanDropTarget {
  return placement === 'before' ? { columnId, beforeRowId: rowId } : { columnId, afterRowId: rowId }
}

export function isSameKanbanDropTarget(
  left: ProjectKanbanDropTarget | null,
  right: ProjectKanbanDropTarget | null,
) {
  if (!left || !right) return left === right
  return (
    left.columnId === right.columnId &&
    left.beforeRowId === right.beforeRowId &&
    left.afterRowId === right.afterRowId
  )
}

export function shouldSkipKanbanDrop(
  rows: DatabaseRow[],
  taskId: string,
  target: ProjectKanbanDropTarget,
  statusPropertyId: string,
) {
  const row = rows.find((item) => item.id === taskId)
  if (!row) return true

  const currentStatus = row.properties[statusPropertyId]
  const statusSame = currentStatus === target.columnId
  const columnRowIds = rows
    .filter((item) => item.properties[statusPropertyId] === target.columnId)
    .map((item) => item.id)
  const currentIndex = columnRowIds.indexOf(taskId)

  if (target.beforeRowId) {
    const targetIndex = columnRowIds.indexOf(target.beforeRowId)
    if (targetIndex !== -1 && statusSame && currentIndex === targetIndex - 1) return true
  }

  if (target.afterRowId) {
    const targetIndex = columnRowIds.indexOf(target.afterRowId)
    if (targetIndex !== -1 && statusSame && currentIndex === targetIndex + 1) return true
  }

  if (!target.beforeRowId && !target.afterRowId && statusSame) {
    if (currentIndex === columnRowIds.length - 1) return true
  }

  return false
}

export function resolveKanbanMoveInput(
  rows: DatabaseRow[],
  groups: BoardGroup[],
  taskId: string,
  target: ProjectKanbanDropTarget,
  statusPropertyId: string,
): KanbanMoveInput | null {
  const row = rows.find((item) => item.id === taskId)
  if (!row || !target.columnId) return null

  const currentStatus = row.properties[statusPropertyId]
  const statusChanged = currentStatus !== target.columnId
  const move: KanbanMoveInput = {}

  if (statusChanged) {
    move.statusPropertyId = statusPropertyId
    move.statusValue = target.columnId
  }

  if (target.beforeRowId || target.afterRowId) {
    move.beforeId = target.beforeRowId ?? null
    move.afterId = target.afterRowId ?? null
    return move
  }

  if (statusChanged) {
    const targetGroup = groups.find((group) => group.id === target.columnId)
    const lastRow = targetGroup?.rows.filter((item) => item.id !== taskId).at(-1)
    if (lastRow) {
      move.afterId = lastRow.id
    }
    return move
  }

  return null
}

export function autoScrollKanbanColumn(
  event: { clientY: number },
  container: HTMLElement,
  edgeSize = 56,
  step = 10,
) {
  const rect = container.getBoundingClientRect()
  if (event.clientY < rect.top + edgeSize) {
    container.scrollTop -= step
  } else if (event.clientY > rect.bottom - edgeSize) {
    container.scrollTop += step
  }
}
