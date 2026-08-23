import { useRef, type DragEvent, type MouseEvent } from 'react'
import { StickyNote } from 'lucide-react'
import type { PropertyDefinition } from '@notesapp/shared'
import { normalizeMultiSelectValue } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { useDeleteRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { useDuplicateTask, useMoveTaskToBoard } from '@/features/projects/hooks/use-task-actions'
import { useProjectBoards } from '@/features/projects/hooks/use-project-boards'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import {
  formatTaskDueDate,
  isTaskDueDateOverdue,
} from '@/features/projects/components/project-task-due-date-field'
import {
  resolveAssigneeMembers,
} from '@/features/projects/components/project-task-assignee-field'
import { ProjectTaskAssigneeStack } from '@/features/projects/components/project-task-assignee-stack'
import { useProjectTaskRowMenu } from '@/features/projects/hooks/use-project-task-row-menu'
import {
  resolveKanbanCardDropPlacement,
  type KanbanCardDropPlacement,
} from '@/features/projects/lib/kanban-drop-target'
import { cn } from '@/lib/cn'

type ProjectTaskCardProps = {
  spaceId: string
  boardId: string
  row: DatabaseRow
  titlePropertyId: string
  labelProperty?: PropertyDefinition
  milestoneProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  groupProperty?: PropertyDefinition
  linkedNoteProperty?: PropertyDefinition
  pages: FlatPage[]
  members: SpaceMember[]
  selected?: boolean
  readOnly?: boolean
  isDragging?: boolean
  subtaskCount?: number
  onOpen: (taskId?: string) => void
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onDragOver: (event: { clientY: number }, element: HTMLElement) => void
  onDrop: (taskId: string, placement: KanbanCardDropPlacement) => void
}

function resolveLinkedPageId(value: unknown) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

function resolveSelectOption(property: PropertyDefinition | undefined, value: unknown) {
  if (!property || typeof value !== 'string') return null
  return property.config?.options?.find((option) => option.id === value) ?? null
}

function resolveLabelOptions(property: PropertyDefinition | undefined, value: unknown) {
  if (!property) return []
  const ids = normalizeMultiSelectValue(value)
  const options = property.config?.options ?? []
  return ids
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
}

export function ProjectTaskCard({
  spaceId,
  boardId,
  row,
  titlePropertyId,
  labelProperty,
  milestoneProperty,
  priorityProperty,
  groupProperty,
  linkedNoteProperty,
  pages,
  members,
  selected = false,
  readOnly = false,
  isDragging = false,
  subtaskCount = 0,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ProjectTaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const deleteRow = useDeleteRow(spaceId, boardId)
  const duplicateTask = useDuplicateTask(spaceId, boardId)
  const moveTask = useMoveTaskToBoard(spaceId, boardId)
  const updateCell = useUpdateCell(spaceId, boardId)
  const { data: boards = [] } = useProjectBoards(spaceId, { enabled: !readOnly })
  const didDragRef = useRef(false)

  const doneStatusId =
    groupProperty?.type === 'select'
      ? (groupProperty.config?.options?.find((option) => option.id === 'done')?.id ?? 'done')
      : 'done'

  const rowMenu = useProjectTaskRowMenu({
    readOnly,
    currentBoardId: boardId,
    boards,
    onOpen: () => onOpen(),
    onDuplicate: () => {
      void duplicateTask.mutateAsync(row.id).then((result) => onOpen(result.row.id))
    },
    onArchive: () => {
      void updateCell.mutateAsync({
        rowId: row.id,
        propertyId: groupProperty?.id ?? 'status',
        value: doneStatusId,
      })
    },
    onMoveToBoard: (targetBoardId) => {
      void moveTask.mutateAsync({ rowId: row.id, targetBoardId })
    },
    onDelete: () => {
      const confirmed = window.confirm('Delete this task?')
      if (!confirmed) return
      void deleteRow.mutateAsync(row.id)
    },
  })

  const title =
    typeof row.properties[titlePropertyId] === 'string' ? row.properties[titlePropertyId] : ''

  const linkedPageId = linkedNoteProperty
    ? resolveLinkedPageId(row.properties[linkedNoteProperty.id])
    : null
  const linkedPage = linkedPageId ? pages.find((page) => page.id === linkedPageId) : undefined
  const labelOptions =
    labelProperty?.type === 'multi_select'
      ? resolveLabelOptions(labelProperty, row.properties.label)
      : resolveSelectOption(labelProperty, row.properties.label)
        ? [resolveSelectOption(labelProperty, row.properties.label)!]
        : []
  const milestoneOption = resolveSelectOption(milestoneProperty, row.properties.milestone)
  const priorityOption = resolveSelectOption(priorityProperty, row.properties.priority)
  const estimate =
    typeof row.properties.estimate === 'number' && Number.isFinite(row.properties.estimate)
      ? row.properties.estimate
      : null
  const dueLabel = formatTaskDueDate(row.properties.due_date)
  const overdue = isTaskDueDateOverdue(row.properties.due_date)
  const assignees = resolveAssigneeMembers(members, row.properties.assignee)

  const hasMeta = Boolean(
    labelOptions.length > 0 ||
      milestoneOption ||
      priorityOption ||
      estimate !== null ||
      dueLabel ||
      assignees.length > 0 ||
      linkedPage ||
      subtaskCount > 0,
  )

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    if (readOnly || !cardRef.current) return
    didDragRef.current = true
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', row.id)

    const source = cardRef.current
    const rect = source.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    const clone = source.cloneNode(true) as HTMLElement
    clone.style.width = `${source.offsetWidth}px`
    clone.style.position = 'fixed'
    clone.style.top = '-1000px'
    clone.style.left = '-1000px'
    clone.style.pointerEvents = 'none'
    document.body.appendChild(clone)
    event.dataTransfer.setDragImage(clone, offsetX, offsetY)
    window.setTimeout(() => clone.remove(), 0)

    onDragStart(row.id)
  }

  function handleDragEnd() {
    onDragEnd()
    window.setTimeout(() => {
      didDragRef.current = false
    }, 0)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (readOnly || isDragging) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    if (!cardRef.current) return
    onDragOver(event, cardRef.current)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (readOnly) return
    event.preventDefault()
    event.stopPropagation()
    const taskId = event.dataTransfer.getData('text/plain')
    if (!taskId || taskId === row.id || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const placement = resolveKanbanCardDropPlacement(event.clientY, rect.top, rect.height)
    onDrop(taskId, placement)
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (didDragRef.current) {
      event.preventDefault()
      return
    }
    onOpen()
  }

  return (
    <>
      <div
        ref={cardRef}
        draggable={!readOnly}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onContextMenu={rowMenu.onContextMenu}
        data-testid="project-task-card"
        data-task-id={row.id}
        className={cn(
          'relative w-full rounded-md border border-border/40 bg-background/50 p-2.5 text-left shadow-sm',
          'transition-[opacity,transform,border-color,box-shadow] duration-150 ease-out',
          'hover:border-white/12 hover:bg-white/[0.03]',
          !readOnly && 'cursor-grab active:cursor-grabbing active:scale-[0.995]',
          selected && 'border-white/16 bg-white/[0.05] ring-1 ring-white/10',
          isDragging && 'opacity-0',
        )}
      >
        <span
          className={cn(
            'block text-sm font-medium leading-snug',
            title.trim() ? 'text-text-emphasis' : 'text-text-primary/35',
          )}
        >
          {title.trim() || 'Untitled task'}
        </span>

        {hasMeta ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {labelOptions.map((option) => (
              <span
                key={option.id}
                className={cn('rounded px-1.5 py-0.5 text-[10px]', selectOptionClassName(option.color))}
              >
                {option.label}
              </span>
            ))}
            {priorityOption ? (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px]',
                  selectOptionClassName(priorityOption.color),
                )}
              >
                {priorityOption.label}
              </span>
            ) : null}
            {milestoneOption ? (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px]',
                  selectOptionClassName(milestoneOption.color),
                )}
              >
                {milestoneOption.label}
              </span>
            ) : null}
            {estimate !== null ? (
              <span className="text-[10px] tabular-nums text-text-primary/45">{estimate} pts</span>
            ) : null}
            {dueLabel ? (
              <span
                className={cn(
                  'text-[10px] tabular-nums',
                  overdue ? 'text-red-300/80' : 'text-text-primary/45',
                )}
              >
                {dueLabel}
              </span>
            ) : null}
            {assignees.length > 0 ? (
              <ProjectTaskAssigneeStack members={assignees} className="ml-auto" />
            ) : null}
            {subtaskCount > 0 ? (
              <span className="text-[10px] tabular-nums text-text-primary/45">
                {subtaskCount} sub{subtaskCount === 1 ? '' : 's'}
              </span>
            ) : null}
            {linkedPage ? (
              <span className="inline-flex max-w-full items-center gap-1 text-[10px] text-text-primary/45">
                <StickyNote className="size-3 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{linkedPage.title || 'Note'}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {rowMenu.panel}
    </>
  )
}
