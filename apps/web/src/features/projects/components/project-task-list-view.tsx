import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { cn } from '@/lib/cn'

type ProjectTaskListViewProps = {
  rows: DatabaseRow[]
  groupProperty: PropertyDefinition
  titlePropertyId: string
  selectedTaskId?: string
  onOpenTask: (taskId: string) => void
}

function readTitle(row: DatabaseRow, titlePropertyId: string) {
  const value = row.properties[titlePropertyId]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Untitled task'
}

function readStatusLabel(row: DatabaseRow, groupProperty: PropertyDefinition) {
  const value = row.properties[groupProperty.id]
  if (typeof value !== 'string' || groupProperty.type !== 'select') return null
  return groupProperty.config?.options?.find((option) => option.id === value)?.label ?? value
}

function readDueDate(row: DatabaseRow) {
  const value = row.properties.due_date
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function ProjectTaskListView({
  rows,
  groupProperty,
  titlePropertyId,
  selectedTaskId,
  onOpenTask,
}: ProjectTaskListViewProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-white/[0.02] px-4 py-10 text-center">
        <p className="text-sm text-text-primary/50">No tasks match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <ul className="divide-y divide-border/50">
        {rows.map((row) => {
          const statusLabel = readStatusLabel(row, groupProperty)
          const statusOption =
            groupProperty.type === 'select'
              ? groupProperty.config?.options?.find(
                  (option) => option.id === row.properties[groupProperty.id],
                )
              : undefined
          const dueDate = readDueDate(row)

          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onOpenTask(row.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                  selectedTaskId === row.id && 'bg-white/[0.05]',
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm text-text-emphasis">
                  {readTitle(row, titlePropertyId)}
                </span>
                {statusLabel ? (
                  <span
                    className={cn(
                      'shrink-0 rounded px-2 py-0.5 text-[11px]',
                      selectOptionClassName(statusOption?.color),
                    )}
                  >
                    {statusLabel}
                  </span>
                ) : null}
                {dueDate ? (
                  <span className="shrink-0 text-[11px] tabular-nums text-text-primary/45">
                    {dueDate}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
