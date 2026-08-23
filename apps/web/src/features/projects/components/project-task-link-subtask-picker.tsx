import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import { selectOptionDotClassName } from '@/features/database/lib/select-option-styles'
import { readTaskTitleFromRow } from '@/features/projects/lib/read-task-title'
import { projectPanelOption } from '@/features/projects/lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'
import { ProjectPanelSelectMenu } from './project-panel-select-menu'
import { cn } from '@/lib/cn'

type ProjectTaskLinkSubtaskPickerProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  candidates: DatabaseRow[]
  groupProperty: PropertyDefinition
  onClose: () => void
  onSelect: (taskId: string) => void
}

function resolveStatusOption(groupProperty: PropertyDefinition, value: unknown) {
  if (groupProperty.type !== 'select' || typeof value !== 'string') return null
  return groupProperty.config?.options?.find((option) => option.id === value) ?? null
}

export function ProjectTaskLinkSubtaskPicker({
  open,
  anchorRef,
  candidates,
  groupProperty,
  onClose,
  onSelect,
}: ProjectTaskLinkSubtaskPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const sorted = [...candidates].sort((left, right) =>
      readTaskTitleFromRow(left).localeCompare(readTaskTitleFromRow(right)),
    )
    if (!normalized) return sorted.slice(0, 40)
    return sorted
      .filter((row) => readTaskTitleFromRow(row).toLowerCase().includes(normalized))
      .slice(0, 40)
  }, [candidates, query])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  return (
    <ProjectPanelPopover
      open={open}
      anchorRef={anchorRef}
      onClose={onClose}
      minWidth={280}
      align="end"
      className="max-h-72 overflow-hidden"
    >
      <div className="border-b border-border/40 px-2 py-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks…"
          className={cn(
            'w-full rounded-md border border-border/50 bg-white/[0.03] px-2.5 py-1.5',
            'text-[12px] text-text-emphasis outline-none placeholder:text-text-primary/35',
            'focus:border-white/15',
          )}
        />
      </div>

      <div className="scrollbar-none max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-text-primary/40">
            {candidates.length === 0
              ? 'No other top-level tasks to link.'
              : 'No tasks match your search.'}
          </p>
        ) : (
          <ProjectPanelSelectMenu>
            {filtered.map((row) => {
              const statusOption = resolveStatusOption(
                groupProperty,
                row.properties[groupProperty.id],
              )

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    onSelect(row.id)
                    onClose()
                    setQuery('')
                  }}
                  className={projectPanelOption(false)}
                >
                  {statusOption ? (
                    <span
                      className={cn('size-2 shrink-0 rounded-full', selectOptionDotClassName(statusOption.color))}
                      aria-hidden
                    />
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-white/20" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px]">
                    {readTaskTitleFromRow(row)}
                  </span>
                </button>
              )
            })}
          </ProjectPanelSelectMenu>
        )}
      </div>
    </ProjectPanelPopover>
  )
}
