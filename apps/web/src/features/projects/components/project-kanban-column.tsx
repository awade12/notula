import { useRef, type DragEvent } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { BoardGroup } from '@/features/database/lib/group-rows'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { selectOptionDotClassName } from '@/features/database/lib/select-option-styles'
import {
  buildKanbanDropTarget,
  type ProjectKanbanDropTarget,
} from '@/features/projects/lib/kanban-drop-target'
import { cn } from '@/lib/cn'
import {
  ProjectKanbanEmptyDropZone,
  ProjectKanbanInsertSlot,
} from './project-kanban-insert-slot'
import { ProjectTaskCard } from './project-task-card'
import { ProjectTaskQuickAdd } from './project-task-quick-add'

type ProjectKanbanColumnProps = {
  spaceId: string
  boardId: string
  group: BoardGroup
  titlePropertyId: string
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages: FlatPage[]
  members: SpaceMember[]
  selectedTaskId?: string
  draggedTaskId?: string | null
  dropTarget?: ProjectKanbanDropTarget | null
  readOnly?: boolean
  onOpenTask: (taskId: string) => void
  onCreateTask: (title: string) => Promise<void>
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onCardDragOver: (
    event: { clientY: number },
    columnId: string,
    rowId: string,
    element: HTMLElement,
    scrollContainer: HTMLElement | null,
  ) => void
  onColumnDragOver: (
    event: { clientY: number },
    columnId: string,
    scrollContainer: HTMLElement | null,
    appendTarget?: ProjectKanbanDropTarget,
  ) => void
  onDrop: (taskId: string, target: ProjectKanbanDropTarget) => void
  onClearDropTarget: () => void
  isCreating?: boolean
}

function isDragLeave(current: HTMLElement, next: EventTarget | null) {
  return !next || !current.contains(next as Node)
}

export function ProjectKanbanColumn({
  spaceId,
  boardId,
  group,
  titlePropertyId,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  linkedNoteProperty,
  pages,
  members,
  selectedTaskId,
  draggedTaskId = null,
  dropTarget = null,
  readOnly = false,
  onOpenTask,
  onCreateTask,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onColumnDragOver,
  onDrop,
  onClearDropTarget,
  isCreating,
}: ProjectKanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnId = group.id ?? ''
  const isDragging = Boolean(draggedTaskId)
  const isColumnActive = isDragging && dropTarget?.columnId === columnId
  const isEmpty = group.rows.length === 0

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>) {
    if (readOnly || !draggedTaskId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    if (isEmpty) {
      onColumnDragOver(event, columnId, scrollRef.current)
      return
    }

    const siblings = group.rows.filter((row) => row.id !== draggedTaskId)
    const lastRow = siblings.at(-1)
    onColumnDragOver(
      event,
      columnId,
      scrollRef.current,
      lastRow ? { columnId, afterRowId: lastRow.id } : { columnId },
    )
  }

  function handleColumnDrop(event: DragEvent<HTMLDivElement>) {
    if (readOnly) return
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (!taskId) return

    if (isEmpty) {
      onDrop(taskId, { columnId })
      return
    }

    const siblings = group.rows.filter((row) => row.id !== taskId)
    const lastRow = siblings.at(-1)
    onDrop(taskId, lastRow ? { columnId, afterRowId: lastRow.id } : { columnId })
  }

  function showInsertBefore(rowId: string) {
    return isColumnActive && dropTarget?.beforeRowId === rowId
  }

  function showInsertAfter(rowId: string) {
    return isColumnActive && dropTarget?.afterRowId === rowId
  }

  function showAppendSlot() {
    return (
      isColumnActive &&
      !dropTarget?.beforeRowId &&
      !dropTarget?.afterRowId &&
      group.rows.length > 0
    )
  }

  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 flex-col self-stretch">
      <div className="mb-3 flex shrink-0 items-center gap-2 px-0.5">
        <span
          className={cn('size-2 shrink-0 rounded-full', selectOptionDotClassName(group.color))}
        />
        <span className="text-xs font-medium text-text-primary/75">{group.label}</span>
        <span className="ml-auto text-[11px] tabular-nums text-text-primary/35">{group.rows.length}</span>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col rounded-lg bg-white/[0.02] p-2"
        onDragOver={handleColumnDragOver}
        onDragLeave={(event) => {
          if (!isDragLeave(event.currentTarget, event.relatedTarget)) return
          if (dropTarget?.columnId === columnId) onClearDropTarget()
        }}
        onDrop={handleColumnDrop}
      >
        <div
          ref={scrollRef}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
        >
          {isEmpty && isDragging ? <ProjectKanbanEmptyDropZone active={isColumnActive} /> : null}

          {group.rows.map((row) => (
            <div key={row.id} className="flex flex-col">
              <ProjectKanbanInsertSlot active={showInsertBefore(row.id)} />
              <ProjectTaskCard
                spaceId={spaceId}
                boardId={boardId}
                row={row}
                titlePropertyId={titlePropertyId}
                labelProperty={labelProperty}
                milestoneProperty={milestoneProperty}
                priorityProperty={priorityProperty}
                linkedNoteProperty={linkedNoteProperty}
                pages={pages}
                members={members}
                selected={selectedTaskId === row.id}
                readOnly={readOnly}
                isDragging={draggedTaskId === row.id}
                onOpen={() => onOpenTask(row.id)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={(event, element) =>
                  onCardDragOver(event, columnId, row.id, element, scrollRef.current)
                }
                onDrop={(taskId, placement) =>
                  onDrop(taskId, buildKanbanDropTarget(columnId, row.id, placement))
                }
              />
              <ProjectKanbanInsertSlot active={showInsertAfter(row.id)} />
            </div>
          ))}

          <ProjectKanbanInsertSlot active={showAppendSlot()} />
        </div>

        {!readOnly ? (
          <div className="mt-2 shrink-0">
            <ProjectTaskQuickAdd onSubmit={onCreateTask} disabled={isCreating} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
