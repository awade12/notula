import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskChevronLeftIcon, taskChevronRightIcon } from '../lib/project-icon-pack'
import {
  CALENDAR_MONTHS,
  CALENDAR_WEEKDAYS,
  buildCalendarCells,
  getTodayIsoDate,
  toIsoDate,
} from '../lib/task-due-date'

type ProjectTaskCalendarProps = {
  viewYear: number
  viewMonth: number
  selectedDate: string
  onViewChange: (year: number, month: number) => void
  onSelect: (isoDate: string) => void
}

export function ProjectTaskCalendar({
  viewYear,
  viewMonth,
  selectedDate,
  onViewChange,
  onSelect,
}: ProjectTaskCalendarProps) {
  const todayIso = getTodayIsoDate()
  const cells = buildCalendarCells(viewYear, viewMonth)

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    onViewChange(next.getFullYear(), next.getMonth())
  }

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="rounded-md p-1 text-text-primary/55 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
        >
          <WorkspaceIcon icon={taskChevronLeftIcon} size={iconSize.menu} />
        </button>
        <p className="text-sm font-medium text-text-emphasis">
          {CALENDAR_MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="rounded-md p-1 text-text-primary/55 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
        >
          <WorkspaceIcon icon={taskChevronRightIcon} size={iconSize.menu} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {CALENDAR_WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-text-primary/40"
          >
            {weekday}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className="size-8" aria-hidden />
          }

          const isoDate = toIsoDate(viewYear, viewMonth, day)
          const isSelected = isoDate === selectedDate
          const isToday = isoDate === todayIso

          return (
            <button
              key={isoDate}
              type="button"
              onClick={() => onSelect(isoDate)}
              className={cn(
                'flex size-8 items-center justify-center rounded-md text-xs tabular-nums transition-colors',
                isSelected
                  ? 'bg-white text-sidebar font-medium'
                  : 'text-text-primary/80 hover:bg-white/[0.08] hover:text-text-emphasis',
                isToday && !isSelected && 'ring-1 ring-inset ring-white/20',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
