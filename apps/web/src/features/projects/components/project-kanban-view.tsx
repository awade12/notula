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
import { filterTopLevelTasks } from '@/features/projects/lib/filter-top-level-tasks'
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
  hiddenGroupIds?: string[]
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
  hiddenGroupIds = [],
  onOpenTask,
}: ProjectKanbanViewProps) {
  const createRow = useCreateRow(spaceId, databaseId)
  const moveKanbanTask = useMoveKanbanTask(spaceId, databaseId)
  const boardRows = useMemo(() => filterTopLevelTasks(rows), [rows])

  const groups = useMemo(() => {
    const all = groupRowsBySelect(boardRows, groupProperty, { includeEmptyGroup: false })
    if (hiddenGroupIds.length === 0) return all
    return all.filter((group) => group.id === null || !hiddenGroupIds.includes(group.id))
  }, [boardRows, groupProperty, hiddenGroupIds])

  const titlePropertyId = titleProperty?.id ?? 'title'

  function persistTaskDrop(taskId: string, target: ProjectKanbanDropTarget) {
    const input = resolveKanbanMoveInput(boardRows, groups, taskId, target, groupProperty.id)
    if (!input) return
    moveKanbanTask.mutate({ rowId: taskId, ...input })
  }

  const drag = useKanbanBoardDrag({
    rows: boardRows,
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
          allRows={rows}
          titlePropertyId={titlePropertyId}
          labelProperty={labelProperty}
          milestoneProperty={milestoneProperty}
          priorityProperty={priorityProperty}
          groupProperty={groupProperty}
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
