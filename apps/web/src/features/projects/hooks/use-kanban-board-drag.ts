import { useCallback, useEffect, useRef, useState } from 'react'
import type { DatabaseRow } from '@/features/database/types'
import {
  autoScrollKanbanColumn,
  buildKanbanDropTarget,
  isSameKanbanDropTarget,
  resolveKanbanCardDropPlacement,
  shouldSkipKanbanDrop,
  type KanbanCardDropPlacement,
  type ProjectKanbanDropTarget,
} from '@/features/projects/lib/kanban-drop-target'

type UseKanbanBoardDragOptions = {
  rows: DatabaseRow[]
  statusPropertyId: string
  readOnly?: boolean
  onDrop: (taskId: string, target: ProjectKanbanDropTarget) => void
}

export function useKanbanBoardDrag({
  rows,
  statusPropertyId,
  readOnly = false,
  onDrop,
}: UseKanbanBoardDragOptions) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<ProjectKanbanDropTarget | null>(null)
  const lastPlacementRef = useRef<{ rowId: string; placement: KanbanCardDropPlacement } | null>(
    null,
  )
  const pendingTargetRef = useRef<ProjectKanbanDropTarget | null>(null)
  const rafRef = useRef<number | null>(null)

  const flushDropTarget = useCallback(() => {
    rafRef.current = null
    setDropTarget((current) =>
      isSameKanbanDropTarget(current, pendingTargetRef.current) ? current : pendingTargetRef.current,
    )
  }, [])

  const scheduleDropTarget = useCallback(
    (next: ProjectKanbanDropTarget | null) => {
      pendingTargetRef.current = next
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(flushDropTarget)
    },
    [flushDropTarget],
  )

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleDragStart = useCallback(
    (taskId: string) => {
      if (readOnly) return
      lastPlacementRef.current = null
      pendingTargetRef.current = null
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setDraggedTaskId(taskId)
      setDropTarget(null)
    },
    [readOnly],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null)
    setDropTarget(null)
    lastPlacementRef.current = null
    pendingTargetRef.current = null
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const handleCardDragOver = useCallback(
    (
      event: { clientY: number },
      columnId: string,
      rowId: string,
      element: HTMLElement,
      scrollContainer: HTMLElement | null,
    ) => {
      if (readOnly || !draggedTaskId || draggedTaskId === rowId) return

      if (scrollContainer) {
        autoScrollKanbanColumn(event, scrollContainer)
      }

      const rect = element.getBoundingClientRect()
      const previous =
        lastPlacementRef.current?.rowId === rowId ? lastPlacementRef.current.placement : null
      const placement = resolveKanbanCardDropPlacement(
        event.clientY,
        rect.top,
        rect.height,
        previous,
      )
      lastPlacementRef.current = { rowId, placement }
      scheduleDropTarget(buildKanbanDropTarget(columnId, rowId, placement))
    },
    [draggedTaskId, readOnly, scheduleDropTarget],
  )

  const handleColumnDragOver = useCallback(
    (
      event: { clientY: number },
      columnId: string,
      scrollContainer: HTMLElement | null,
      appendTarget?: ProjectKanbanDropTarget,
    ) => {
      if (readOnly || !draggedTaskId) return

      if (scrollContainer) {
        autoScrollKanbanColumn(event, scrollContainer)
      }

      lastPlacementRef.current = null
      scheduleDropTarget(appendTarget ?? { columnId })
    },
    [draggedTaskId, readOnly, scheduleDropTarget],
  )

  const handleDrop = useCallback(
    (taskId: string, target: ProjectKanbanDropTarget) => {
      if (readOnly) return
      if (shouldSkipKanbanDrop(rows, taskId, target, statusPropertyId)) {
        handleDragEnd()
        return
      }
      onDrop(taskId, target)
      handleDragEnd()
    },
    [handleDragEnd, onDrop, readOnly, rows, statusPropertyId],
  )

  return {
    draggedTaskId,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleCardDragOver,
    handleColumnDragOver,
    handleDrop,
    setDropTargetIfChanged: scheduleDropTarget,
  }
}
