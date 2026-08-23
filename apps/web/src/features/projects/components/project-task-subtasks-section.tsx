import { Link2, Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { PROJECT_BOARD_PROPERTY_IDS, type PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import { useCreateRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { listLinkableSubtaskCandidates } from '@/features/projects/lib/list-linkable-subtask-candidates'
import {
  filterSubtasks,
  readParentTaskId,
} from '@/features/projects/lib/filter-top-level-tasks'
import { readTaskTitleFromRow } from '@/features/projects/lib/read-task-title'
import {
  computeSubtaskProgress,
  resolveDoneStatusId,
  sortSubtasksForDisplay,
} from '@/features/projects/lib/subtask-progress'
import { cn } from '@/lib/cn'
import { ProjectTaskLinkSubtaskPicker } from './project-task-link-subtask-picker'
import { ProjectTaskSubtaskRow } from './project-task-subtask-row'

type ProjectTaskSubtasksSectionProps = {
  spaceId: string
  boardId: string
  parentRow: DatabaseRow
  rows: DatabaseRow[]
  groupProperty: PropertyDefinition
  readOnly?: boolean
  onOpenTask: (taskId: string) => void
}

export function ProjectTaskSubtasksSection({
  spaceId,
  boardId,
  parentRow,
  rows,
  groupProperty,
  readOnly = false,
  onOpenTask,
}: ProjectTaskSubtasksSectionProps) {
  const createRow = useCreateRow(spaceId, boardId)
  const updateCell = useUpdateCell(spaceId, boardId)
  const linkButtonRef = useRef<HTMLButtonElement>(null)
  const [linkPickerOpen, setLinkPickerOpen] = useState(false)

  const subtasks = useMemo(() => filterSubtasks(rows, parentRow.id), [parentRow.id, rows])
  const doneStatusId = resolveDoneStatusId(groupProperty)
  const progress = useMemo(
    () => computeSubtaskProgress(subtasks, groupProperty.id, doneStatusId),
    [doneStatusId, groupProperty.id, subtasks],
  )
  const sortedSubtasks = useMemo(
    () => sortSubtasksForDisplay(subtasks, groupProperty.id, doneStatusId, readTaskTitleFromRow),
    [doneStatusId, groupProperty.id, subtasks],
  )
  const linkCandidates = useMemo(
    () => listLinkableSubtaskCandidates(rows, parentRow.id),
    [parentRow.id, rows],
  )

  const parentStatus = parentRow.properties[PROJECT_BOARD_PROPERTY_IDS.status]

  async function handleCreateSubtask() {
    const inheritedStatus =
      typeof parentStatus === 'string' && parentStatus ? parentStatus : undefined

    const result = await createRow.mutateAsync({
      properties: {
        [PROJECT_BOARD_PROPERTY_IDS.title]: 'Untitled subtask',
        [PROJECT_BOARD_PROPERTY_IDS.parentTask]: parentRow.id,
        ...(inheritedStatus ? { [PROJECT_BOARD_PROPERTY_IDS.status]: inheritedStatus } : {}),
      },
    })
    onOpenTask(result.row.id)
  }

  async function handleLinkExisting(taskId: string) {
    await updateCell.mutateAsync({
      rowId: taskId,
      propertyId: PROJECT_BOARD_PROPERTY_IDS.parentTask,
      value: parentRow.id,
    })
  }

  return (
    <div className="border-t border-border/50 px-3 py-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-dashboard text-text-primary/50">
              Subtasks
            </span>
            {progress.total > 0 ? (
              <span className="text-[11px] tabular-nums text-text-primary/35">
                {progress.completed}/{progress.total}
              </span>
            ) : null}
          </div>
          {progress.total > 0 ? (
            <div className="mt-1.5 h-1 w-full max-w-[8rem] overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-emerald-400/70 transition-[width] duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              ref={linkButtonRef}
              type="button"
              onClick={() => setLinkPickerOpen(true)}
              disabled={linkCandidates.length === 0}
              title={
                linkCandidates.length === 0
                  ? 'No other tasks available to link'
                  : 'Link an existing task'
              }
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-primary/45',
                'transition-colors hover:bg-white/[0.04] hover:text-text-primary/70',
                'disabled:cursor-not-allowed disabled:opacity-35',
              )}
            >
              <Link2 className="size-3" strokeWidth={2} />
              Link
            </button>
            <button
              type="button"
              onClick={() => void handleCreateSubtask()}
              disabled={createRow.isPending}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-primary/45',
                'transition-colors hover:bg-white/[0.04] hover:text-text-primary/70',
              )}
            >
              <Plus className="size-3" strokeWidth={2} />
              New
            </button>
          </div>
        ) : null}
      </div>

      {sortedSubtasks.length === 0 ? (
        <p className="px-0.5 text-[12px] leading-relaxed text-text-primary/35">
          {readOnly
            ? 'No subtasks.'
            : 'Break this task down with new subtasks or link tasks already on the board.'}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {sortedSubtasks.map((subtask) => (
            <li key={subtask.id}>
              <ProjectTaskSubtaskRow
                spaceId={spaceId}
                boardId={boardId}
                row={subtask}
                groupProperty={groupProperty}
                readOnly={readOnly}
                onOpen={() => onOpenTask(subtask.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {!readOnly ? (
        <ProjectTaskLinkSubtaskPicker
          open={linkPickerOpen}
          anchorRef={linkButtonRef}
          candidates={linkCandidates}
          groupProperty={groupProperty}
          onClose={() => setLinkPickerOpen(false)}
          onSelect={(taskId) => void handleLinkExisting(taskId)}
        />
      ) : null}
    </div>
  )
}

export function readTaskParentId(row: DatabaseRow) {
  return readParentTaskId(row.properties)
}
