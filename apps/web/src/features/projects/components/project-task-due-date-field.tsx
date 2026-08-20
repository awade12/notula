import { useRef, useState } from 'react'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import {
  formatTaskDueDate,
  formatTaskDueDateLong,
  getTodayIsoDate,
  isTaskDueDateOverdue,
  parseIsoDate,
  readDueDate,
} from '../lib/task-due-date'
import {
  taskCalendarIcon,
  taskChevronDownIcon,
  taskCloseIcon,
} from '../lib/project-icon-pack'
import { projectPanelFieldTrigger } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'
import { ProjectTaskCalendar } from './project-task-calendar'

type ProjectTaskDueDateFieldProps = {
  value: unknown
  readOnly?: boolean
  variant?: 'field' | 'compact'
  onCommit: (value: string) => void
}

export function ProjectTaskDueDateField({
  value,
  readOnly = false,
  variant = 'field',
  onCommit,
}: ProjectTaskDueDateFieldProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dueDate = readDueDate(value)
  const displayLabel =
    variant === 'compact' ? formatTaskDueDate(dueDate) : formatTaskDueDateLong(dueDate)
  const overdue = isTaskDueDateOverdue(dueDate)

  const initialView = dueDate ? parseIsoDate(dueDate) : parseIsoDate(getTodayIsoDate())
  const [viewYear, setViewYear] = useState(initialView.year)
  const [viewMonth, setViewMonth] = useState(initialView.month)

  function openCalendar() {
    if (readOnly) return
    const nextView = dueDate ? parseIsoDate(dueDate) : parseIsoDate(getTodayIsoDate())
    setViewYear(nextView.year)
    setViewMonth(nextView.month)
    setOpen(true)
  }

  const isCompact = variant === 'compact'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={readOnly}
        onClick={openCalendar}
        className={cn(
          isCompact
            ? cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/40',
                'bg-white/[0.03] px-2 py-1 text-xs transition-colors hover:bg-white/[0.06]',
                overdue ? 'text-red-300/85' : 'text-text-primary/70',
                !displayLabel && 'text-text-primary/40',
              )
            : cn(projectPanelFieldTrigger, !displayLabel && 'text-text-primary/40'),
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <WorkspaceIcon
            icon={taskCalendarIcon}
            size={isCompact ? iconSize.section : iconSize.menu}
            className={overdue ? 'text-red-300/70' : 'text-text-primary/45'}
          />
          <span className="truncate">{displayLabel ?? (isCompact ? 'Due date' : 'No due date')}</span>
        </span>
        {!readOnly && !isCompact ? (
          <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} className="text-text-primary/40" />
        ) : null}
      </button>

      <ProjectPanelPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        minWidth={280}
        className="p-0"
      >
        <ProjectTaskCalendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={dueDate}
          onViewChange={(year, month) => {
            setViewYear(year)
            setViewMonth(month)
          }}
          onSelect={(isoDate) => {
            onCommit(isoDate)
            setOpen(false)
          }}
        />

        <div className="flex items-center justify-between border-t border-white/8 px-2 py-1.5">
          <button
            type="button"
            onClick={() => {
              onCommit(getTodayIsoDate())
              setOpen(false)
            }}
            className="rounded-md px-2 py-1 text-xs text-text-primary/70 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
          >
            Today
          </button>
          {dueDate ? (
            <button
              type="button"
              onClick={() => {
                onCommit('')
                setOpen(false)
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-primary/70 transition-colors hover:bg-white/[0.06] hover:text-text-emphasis"
            >
              <WorkspaceIcon icon={taskCloseIcon} size={iconSize.section} />
              Clear
            </button>
          ) : null}
        </div>
      </ProjectPanelPopover>
    </>
  )
}

export {
  formatTaskDueDate,
  formatTaskDueDateLong,
  isTaskDueDateOverdue,
  readDueDate,
} from '../lib/task-due-date'
