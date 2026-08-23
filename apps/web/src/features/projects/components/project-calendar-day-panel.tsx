import type { DatabaseRow } from '@/features/database/types'
import { cn } from '@/lib/cn'
import { formatCalendarDayHeading, formatTaskDueDateLong } from '../lib/task-due-date'

type ProjectCalendarDayPanelProps = {
  selectedDate: string
  todayIso: string
  tasks: DatabaseRow[]
  titlePropertyId: string
  selectedTaskId?: string
  onOpenTask: (taskId: string) => void
}

function readTitle(row: DatabaseRow, titlePropertyId: string) {
  const value = row.properties[titlePropertyId]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Untitled task'
}

export function ProjectCalendarDayPanel({
  selectedDate,
  todayIso,
  tasks,
  titlePropertyId,
  selectedTaskId,
  onOpenTask,
}: ProjectCalendarDayPanelProps) {
  const heading = formatCalendarDayHeading(selectedDate, todayIso)
  const subtitle = formatTaskDueDateLong(selectedDate)

  return (
    <div className="flex min-h-64 flex-col rounded-lg border border-border/60 bg-white/[0.02] lg:min-h-0 lg:max-h-[calc(100vh-16rem)]">
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-medium tracking-dashboard text-text-emphasis">{heading}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-text-primary/45">{subtitle}</p>
        ) : null}
        <p className="mt-2 text-[11px] uppercase tracking-wide text-text-primary/35">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} due
        </p>
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center px-4 text-center">
            <p className="text-sm text-text-primary/45">No tasks due on this date.</p>
            <p className="mt-1 text-xs text-text-primary/30">
              Tasks with a due date will appear here and on the calendar.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(row.id)}
                  className={cn(
                    'w-full rounded-lg border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]',
                    selectedTaskId === row.id && 'border-white/15 bg-white/[0.06]',
                  )}
                >
                  <span className="block truncate text-sm text-text-emphasis">
                    {readTitle(row, titlePropertyId)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
