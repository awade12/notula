import { type MouseEvent } from 'react'
import { Check, X } from 'lucide-react'
import { PROJECT_BOARD_PROPERTY_IDS, type PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { readTaskTitleFromRow } from '@/features/projects/lib/read-task-title'
import {
  isSubtaskDone,
  resolveDoneStatusId,
} from '@/features/projects/lib/subtask-progress'
import { cn } from '@/lib/cn'

type ProjectTaskSubtaskRowProps = {
  spaceId: string
  boardId: string
  row: DatabaseRow
  groupProperty: PropertyDefinition
  readOnly?: boolean
  onOpen: () => void
}

function resolveStatusOption(groupProperty: PropertyDefinition, value: unknown) {
  if (groupProperty.type !== 'select' || typeof value !== 'string') return null
  return groupProperty.config?.options?.find((option) => option.id === value) ?? null
}

function resolveReopenStatusId(groupProperty: PropertyDefinition, doneStatusId: string) {
  if (groupProperty.type !== 'select') return 'todo'
  const options = groupProperty.config?.options ?? []
  const fallback =
    options.find((option) => option.id === 'todo') ??
    options.find((option) => option.id !== doneStatusId) ??
    options[0]
  return fallback?.id ?? 'todo'
}

export function ProjectTaskSubtaskRow({
  spaceId,
  boardId,
  row,
  groupProperty,
  readOnly = false,
  onOpen,
}: ProjectTaskSubtaskRowProps) {
  const updateCell = useUpdateCell(spaceId, boardId)
  const doneStatusId = resolveDoneStatusId(groupProperty)
  const statusPropertyId = groupProperty.id
  const isDone = isSubtaskDone(row, statusPropertyId, doneStatusId)
  const statusOption = resolveStatusOption(groupProperty, row.properties[statusPropertyId])
  const title = readTaskTitleFromRow(row)

  async function handleToggleDone(event: MouseEvent) {
    event.stopPropagation()
    if (readOnly) return

    const nextStatus = isDone
      ? resolveReopenStatusId(groupProperty, doneStatusId)
      : doneStatusId

    await updateCell.mutateAsync({
      rowId: row.id,
      propertyId: statusPropertyId,
      value: nextStatus,
    })
  }

  async function handleUnlink(event: MouseEvent) {
    event.stopPropagation()
    if (readOnly) return

    await updateCell.mutateAsync({
      rowId: row.id,
      propertyId: PROJECT_BOARD_PROPERTY_IDS.parentTask,
      value: '',
    })
  }

  return (
    <div
      className={cn(
        'group/subtask flex items-center gap-2 rounded-md px-1.5 py-1',
        'transition-colors hover:bg-white/[0.04]',
      )}
    >
      <button
        type="button"
        aria-label={isDone ? 'Mark subtask incomplete' : 'Mark subtask complete'}
        disabled={readOnly}
        onClick={(event) => void handleToggleDone(event)}
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
          isDone
            ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
            : 'border-white/15 bg-transparent text-transparent hover:border-white/25',
          readOnly && 'cursor-default opacity-70',
        )}
      >
        {isDone ? <Check className="size-2.5" strokeWidth={2.5} /> : null}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[12px]',
            isDone ? 'text-text-primary/40 line-through' : 'text-text-primary/80',
          )}
        >
          {title}
        </span>
        {statusOption && !isDone ? (
          <span
            className={cn(
              'hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] sm:inline',
              selectOptionClassName(statusOption.color),
            )}
          >
            {statusOption.label}
          </span>
        ) : null}
      </button>

      {!readOnly ? (
        <button
          type="button"
          aria-label="Remove subtask link"
          onClick={(event) => void handleUnlink(event)}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md text-text-primary/30',
            'opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-text-primary/60',
            'group-hover/subtask:opacity-100',
          )}
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}
