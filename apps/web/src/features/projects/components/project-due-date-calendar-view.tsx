import { useMemo, useState } from 'react'
import type { DatabaseRow } from '@/features/database/types'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { ProjectCalendarDayPanel } from '@/features/projects/components/project-calendar-day-panel'
import { ProjectCalendarMonthGrid } from '@/features/projects/components/project-calendar-month-grid'
import { taskChevronLeftIcon, taskChevronRightIcon } from '@/features/projects/lib/project-icon-pack'
import {
  CALENDAR_MONTHS,
  getTodayIsoDate,
  parseIsoDate,
  toIsoDate,
} from '@/features/projects/lib/task-due-date'

type ProjectDueDateCalendarViewProps = {
  rows: DatabaseRow[]
  titlePropertyId: string
  selectedTaskId?: string
  onOpenTask: (taskId: string) => void
}

function readDueDate(row: DatabaseRow) {
  const value = row.properties.due_date
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function ProjectDueDateCalendarView({
  rows,
  titlePropertyId,
  selectedTaskId,
  onOpenTask,
}: ProjectDueDateCalendarViewProps) {
  const todayIso = getTodayIsoDate()
  const initial = new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayIso)

  const tasksByDate = useMemo(() => {
    const map = new Map<string, DatabaseRow[]>()
    for (const row of rows) {
      const dueDate = readDueDate(row)
      if (!dueDate) continue
      const bucket = map.get(dueDate) ?? []
      bucket.push(row)
      map.set(dueDate, bucket)
    }
    return map
  }, [rows])

  const monthTaskCount = useMemo(() => {
    let count = 0
    for (const [isoDate, tasks] of tasksByDate) {
      const { year, month } = parseIsoDate(isoDate)
      if (year === viewYear && month === viewMonth) {
        count += tasks.length
      }
    }
    return count
  }, [tasksByDate, viewYear, viewMonth])

  const dayTasks = tasksByDate.get(selectedDate) ?? []

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    const nextYear = next.getFullYear()
    const nextMonth = next.getMonth()
    setViewYear(nextYear)
    setViewMonth(nextMonth)
    alignSelectionToMonth(nextYear, nextMonth)
  }

  function goToToday() {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDate(todayIso)
  }

  function alignSelectionToMonth(year: number, month: number) {
    const { year: selectedYear, month: selectedMonth } = parseIsoDate(selectedDate)
    if (selectedYear === year && selectedMonth === month) return

    const today = parseIsoDate(todayIso)
    if (today.year === year && today.month === month) {
      setSelectedDate(todayIso)
      return
    }

    setSelectedDate(toIsoDate(year, month, 1))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="rounded-md p-1.5 text-text-primary/55 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
          >
            <WorkspaceIcon icon={taskChevronLeftIcon} size={iconSize.menu} />
          </button>
          <h2 className="min-w-36 text-center text-sm font-medium tracking-dashboard text-text-emphasis">
            {CALENDAR_MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="rounded-md p-1.5 text-text-primary/55 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
          >
            <WorkspaceIcon icon={taskChevronRightIcon} size={iconSize.menu} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-primary/40">
            {monthTaskCount} due this month
          </span>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md border border-border/50 px-2.5 py-1 text-xs tracking-dashboard text-text-primary/60 transition-colors hover:bg-white/[0.04] hover:text-text-emphasis"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <ProjectCalendarMonthGrid
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          tasksByDate={tasksByDate}
          titlePropertyId={titlePropertyId}
          selectedTaskId={selectedTaskId}
          onSelectDate={setSelectedDate}
          onOpenTask={onOpenTask}
        />

        <ProjectCalendarDayPanel
          selectedDate={selectedDate}
          todayIso={todayIso}
          tasks={dayTasks}
          titlePropertyId={titlePropertyId}
          selectedTaskId={selectedTaskId}
          onOpenTask={onOpenTask}
        />
      </div>
    </div>
  )
}
