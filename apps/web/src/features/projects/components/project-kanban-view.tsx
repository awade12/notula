import { useMemo } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { groupRowsBySelect } from '@/features/database/lib/group-rows'
import { useCreateRow, useMoveKanbanTask } from '@/features/database/hooks/use-update-cell'
import {
  resolveKanbanMoveInput,
  type ProjectKanbanDropTarget,
} from '@/features/projects/lib/kanban-drop-target'
import { useKanbanBoardDrag } from '@/features/projects/hooks/use-kanban-board-drag'
import { ProjectKanbanColumn } from './project-kanban-column'

type ProjectKanbanViewProps = {
  databaseId: string
  spaceId: string
  rows: DatabaseRow[]
  groupProperty: PropertyDefinition
  titleProperty: PropertyDefinition | undefined
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  estimateProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages?: FlatPage[]
  members?: SpaceMember[]
  selectedTaskId?: string
  readOnly?: boolean
  onOpenTask: (taskId: string) => void
}

export function ProjectKanbanView({
  spaceId,
  databaseId,
  rows,
  groupProperty,
  titleProperty,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  linkedNoteProperty,
  pages = [],
  members = [],
  selectedTaskId,
  readOnly = false,
  onOpenTask,
}: ProjectKanbanViewProps) {
  const createRow = useCreateRow(spaceId, databaseId)
  const moveKanbanTask = useMoveKanbanTask(spaceId, databaseId)

  const groups = useMemo(
    () => groupRowsBySelect(rows, groupProperty, { includeEmptyGroup: false }),
    [groupProperty, rows],
  )

  const titlePropertyId = titleProperty?.id ?? 'title'

  function persistTaskDrop(taskId: string, target: ProjectKanbanDropTarget) {
    const input = resolveKanbanMoveInput(rows, groups, taskId, target, groupProperty.id)
    if (!input) return
    moveKanbanTask.mutate({ rowId: taskId, ...input })
  }

  const drag = useKanbanBoardDrag({
    rows,
    statusPropertyId: groupProperty.id,
    readOnly,
    onDrop: persistTaskDrop,
  })

  async function handleCreateTask(statusId: string | null, title: string) {
    if (!statusId) return

    const result = await createRow.mutateAsync({
      properties: {
        [titlePropertyId]: title,
        [groupProperty.id]: statusId,
      },
    })
    onOpenTask(result.row.id)
  }

  return (
    <div className="flex h-full min-h-0 gap-4 overflow-x-auto pb-4 scrollbar-none">
      {groups.map((group) => (
        <ProjectKanbanColumn
          key={group.id ?? 'empty'}
          spaceId={spaceId}
          boardId={databaseId}
          group={group}
          titlePropertyId={titlePropertyId}
          labelProperty={labelProperty}
          milestoneProperty={milestoneProperty}
          priorityProperty={priorityProperty}
          linkedNoteProperty={linkedNoteProperty}
          pages={pages}
          members={members}
          selectedTaskId={selectedTaskId}
          draggedTaskId={drag.draggedTaskId}
          dropTarget={drag.dropTarget}
          readOnly={readOnly}
          isCreating={createRow.isPending}
          onOpenTask={onOpenTask}
          onCreateTask={(title) => handleCreateTask(group.id, title)}
          onDragStart={drag.handleDragStart}
          onDragEnd={drag.handleDragEnd}
          onCardDragOver={drag.handleCardDragOver}
          onColumnDragOver={drag.handleColumnDragOver}
          onDrop={drag.handleDrop}
          onClearDropTarget={() => drag.setDropTargetIfChanged(null)}
        />
      ))}
    </div>
  )
}
