import { useRef, useState } from 'react'
import type { PropertyDefinition, SelectOption } from '@notesapp/shared'
import { normalizeMultiSelectValue } from '@notesapp/shared'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { dbSelectPill } from '@/features/database/lib/database-classes'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskCheckIcon, taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelFieldTrigger, projectPanelOption } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'

type ProjectTaskMultiSelectFieldProps = {
  property: PropertyDefinition
  value: unknown
  readOnly?: boolean
  emptyLabel?: string
  onCommit: (value: unknown) => void
}

export function ProjectTaskMultiSelectField({
  property,
  value,
  readOnly = false,
  emptyLabel = 'No labels',
  onCommit,
}: ProjectTaskMultiSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const options = property.config?.options ?? []
  const selectedIds = normalizeMultiSelectValue(value)
  const selectedOptions = options.filter((option) => selectedIds.includes(option.id))

  function toggleOption(optionId: string) {
    const next = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId]
    onCommit(next)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) setOpen((currentOpen) => !currentOpen)
        }}
        className={cn(
          projectPanelFieldTrigger,
          'min-h-9 h-auto flex-wrap gap-1 py-1.5',
          selectedOptions.length === 0 && 'text-text-primary/40',
        )}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => <SelectPill key={option.id} option={option} />)
        ) : (
          <span>{emptyLabel}</span>
        )}
        {!readOnly ? (
          <WorkspaceIcon
            icon={taskChevronDownIcon}
            size={iconSize.section}
            className="ml-auto shrink-0 text-text-primary/40"
          />
        ) : null}
      </button>

      <ProjectPanelPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        minWidth={240}
      >
        {options.map((option) => (
          <OptionRow
            key={option.id}
            label={option.label}
            selected={selectedIds.includes(option.id)}
            option={option}
            onSelect={() => toggleOption(option.id)}
          />
        ))}
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onCommit([])
              setOpen(false)
            }}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-text-primary/45 transition-colors hover:bg-white/[0.08] hover:text-text-primary/70 active:bg-white/[0.12]"
          >
            Clear all
          </button>
        ) : null}
      </ProjectPanelPopover>
    </>
  )
}

function SelectPill({ option }: { option: SelectOption }) {
  return (
    <span className={cn(dbSelectPill, 'truncate', selectOptionClassName(option.color))}>
      {option.label}
    </span>
  )
}

function OptionRow({
  label,
  selected,
  option,
  onSelect,
}: {
  label: string
  selected: boolean
  option?: SelectOption
  onSelect: () => void
}) {
  return (
    <button type="button" onClick={onSelect} className={projectPanelOption(selected)}>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {selected ? <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} /> : null}
      </span>
      {option ? <SelectPill option={option} /> : <span>{label}</span>}
    </button>
  )
}
