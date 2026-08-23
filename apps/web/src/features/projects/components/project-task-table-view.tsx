import { useMemo } from 'react'
import { normalizeMultiSelectValue, type PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import {
  formatTaskDueDate,
  isTaskDueDateOverdue,
} from '@/features/projects/lib/task-due-date'
import { resolveAssigneeMembers } from '@/features/projects/components/project-task-assignee-field'
import { ProjectTaskAssigneeStack } from '@/features/projects/components/project-task-assignee-stack'
import { filterTopLevelTasks } from '@/features/projects/lib/filter-top-level-tasks'
import { cn } from '@/lib/cn'

type ProjectTaskTableViewProps = {
  rows: DatabaseRow[]
  titlePropertyId: string
  groupProperty: PropertyDefinition
  labelProperty?: PropertyDefinition
  priorityProperty?: PropertyDefinition
  members?: SpaceMember[]
  selectedTaskId?: string
  onOpenTask: (taskId: string) => void
}

const GRID =
  'grid grid-cols-[minmax(0,2fr)_7.5rem_9rem_6.5rem_6.5rem_3.5rem] gap-x-3 px-4'

function readTitle(row: DatabaseRow, titlePropertyId: string) {
  const value = row.properties[titlePropertyId]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Untitled task'
}

function resolveSelectOption(property: PropertyDefinition | undefined, value: unknown) {
  if (!property || typeof value !== 'string') return null
  return property.config?.options?.find((option) => option.id === value) ?? null
}

function resolveLabels(property: PropertyDefinition | undefined, value: unknown) {
  if (!property || property.type !== 'multi_select') return []
  const ids = normalizeMultiSelectValue(value)
  const options = property.config?.options ?? []
  return ids
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .slice(0, 2)
}

export function ProjectTaskTableView({
  rows,
  titlePropertyId,
  groupProperty,
  labelProperty,
  priorityProperty,
  members = [],
  selectedTaskId,
  onOpenTask,
}: ProjectTaskTableViewProps) {
  const boardRows = useMemo(() => filterTopLevelTasks(rows), [rows])

  if (boardRows.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm text-text-primary/50">No tasks match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-white/[0.015]">
      <div className="overflow-x-auto">
        <div className="min-w-[42rem]">
      <div className={cn(GRID, 'border-b border-border/50 py-2.5')}>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Task
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Status
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Labels
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Priority
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Due
        </span>
        <span className="text-center text-[11px] font-medium uppercase tracking-wider text-text-primary/40">
          Owner
        </span>
      </div>

      <ul className="divide-y divide-border/40">
        {boardRows.map((row) => {
          const statusOption = resolveSelectOption(groupProperty, row.properties[groupProperty.id])
          const labelOptions = resolveLabels(labelProperty, row.properties.label)
          const extraLabelCount =
            labelProperty?.type === 'multi_select'
              ? Math.max(
                  0,
                  normalizeMultiSelectValue(row.properties.label).length - labelOptions.length,
                )
              : 0
          const priorityOption = resolveSelectOption(priorityProperty, row.properties.priority)
          const dueLabel = formatTaskDueDate(row.properties.due_date)
          const overdue = isTaskDueDateOverdue(row.properties.due_date)
          const assignees = resolveAssigneeMembers(members, row.properties.assignee)

          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onOpenTask(row.id)}
                className={cn(
                  GRID,
                  'w-full py-2.5 text-left transition-colors hover:bg-white/[0.03]',
                  selectedTaskId === row.id && 'bg-white/[0.05]',
                )}
              >
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    readTitle(row, titlePropertyId) === 'Untitled task'
                      ? 'text-text-primary/35'
                      : 'text-text-emphasis',
                  )}
                >
                  {readTitle(row, titlePropertyId)}
                </span>

                <span className="min-w-0">
                  {statusOption ? (
                    <span
                      className={cn(
                        'inline-flex max-w-full truncate rounded px-2 py-0.5 text-[11px]',
                        selectOptionClassName(statusOption.color),
                      )}
                    >
                      {statusOption.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-primary/30">—</span>
                  )}
                </span>

                <span className="flex min-w-0 items-center gap-1">
                  {labelOptions.length === 0 ? (
                    <span className="text-[11px] text-text-primary/30">—</span>
                  ) : (
                    <>
                      {labelOptions.map((option) => (
                        <span
                          key={option.id}
                          className={cn(
                            'max-w-[4.5rem] truncate rounded px-1.5 py-0.5 text-[10px]',
                            selectOptionClassName(option.color),
                          )}
                        >
                          {option.label}
                        </span>
                      ))}
                      {extraLabelCount > 0 ? (
                        <span className="text-[10px] tabular-nums text-text-primary/40">
                          +{extraLabelCount}
                        </span>
                      ) : null}
                    </>
                  )}
                </span>

                <span className="min-w-0">
                  {priorityOption ? (
                    <span
                      className={cn(
                        'inline-flex max-w-full truncate rounded px-2 py-0.5 text-[11px]',
                        selectOptionClassName(priorityOption.color),
                      )}
                    >
                      {priorityOption.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-primary/30">—</span>
                  )}
                </span>

                <span
                  className={cn(
                    'truncate text-[11px] tabular-nums',
                    overdue ? 'text-red-300/80' : dueLabel ? 'text-text-primary/50' : 'text-text-primary/30',
                  )}
                >
                  {dueLabel ?? '—'}
                </span>

                <span className="flex justify-center">
                  {assignees.length > 0 ? (
                    <ProjectTaskAssigneeStack members={assignees} size="md" />
                  ) : (
                    <span className="text-[11px] text-text-primary/30">—</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
        </div>
      </div>
    </div>
  )
}
