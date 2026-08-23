import type { DatabaseRow } from '@/features/database/types'
import { cn } from '@/lib/cn'
import {
  CALENDAR_WEEKDAYS,
  buildCalendarCells,
  getTodayIsoDate,
  toIsoDate,
} from '../lib/task-due-date'

const MAX_VISIBLE_TASKS = 3

type ProjectCalendarMonthGridProps = {
  viewYear: number
  viewMonth: number
  selectedDate: string
  tasksByDate: Map<string, DatabaseRow[]>
  titlePropertyId: string
  selectedTaskId?: string
  onSelectDate: (isoDate: string) => void
  onOpenTask: (taskId: string) => void
}

function readTitle(row: DatabaseRow, titlePropertyId: string) {
  const value = row.properties[titlePropertyId]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Untitled task'
}

export function ProjectCalendarMonthGrid({
  viewYear,
  viewMonth,
  selectedDate,
  tasksByDate,
  titlePropertyId,
  selectedTaskId,
  onSelectDate,
  onOpenTask,
}: ProjectCalendarMonthGridProps) {
  const todayIso = getTodayIsoDate()
  const cells = buildCalendarCells(viewYear, viewMonth)

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-white/[0.02]">
      <div className="grid grid-cols-7 border-b border-border/50 bg-white/[0.02]">
        {CALENDAR_WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-2 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-text-primary/40"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-24 border-b border-r border-border/30 bg-white/[0.01] nth-[7n]:border-r-0"
                aria-hidden
              />
            )
          }

          const isoDate = toIsoDate(viewYear, viewMonth, day)
          const dayTasks = tasksByDate.get(isoDate) ?? []
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS)
          const hiddenCount = dayTasks.length - visibleTasks.length
          const isSelected = isoDate === selectedDate
          const isToday = isoDate === todayIso

          return (
            <div
              key={isoDate}
              className={cn(
                'group/cell relative flex min-h-24 flex-col border-b border-r border-border/30 p-1.5 nth-[7n]:border-r-0',
                isSelected && 'bg-white/[0.05]',
                isToday && !isSelected && 'bg-white/[0.025]',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDate(isoDate)}
                className={cn(
                  'mb-1 flex size-7 shrink-0 items-center justify-center self-end rounded-md text-xs tabular-nums transition-colors',
                  isSelected
                    ? 'bg-white text-sidebar font-medium'
                    : 'text-text-primary/70 hover:bg-white/[0.08] hover:text-text-emphasis',
                  isToday && !isSelected && 'ring-1 ring-inset ring-white/20',
                )}
              >
                {day}
              </button>

              <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                {visibleTasks.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenTask(row.id)
                    }}
                    className={cn(
                      'w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors',
                      'bg-sky-500/15 text-sky-100/90 hover:bg-sky-500/25',
                      selectedTaskId === row.id && 'ring-1 ring-inset ring-sky-300/40',
                    )}
                    title={readTitle(row, titlePropertyId)}
                  >
                    {readTitle(row, titlePropertyId)}
                  </button>
                ))}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDate(isoDate)}
                    className="px-1.5 py-0.5 text-left text-[10px] text-text-primary/45 transition-colors hover:text-text-primary/70"
                  >
                    +{hiddenCount} more
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
