import { useRef, useState } from 'react'
import type { PropertyDefinition, SelectOption } from '@notesapp/shared'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { dbSelectPill } from '@/features/database/lib/database-classes'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskCheckIcon, taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelFieldTrigger, projectPanelOption } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'

type ProjectTaskSelectFieldProps = {
  property: PropertyDefinition
  value: unknown
  readOnly?: boolean
  emptyLabel?: string
  onCommit: (value: unknown) => void
}

export function ProjectTaskSelectField({
  property,
  value,
  readOnly = false,
  emptyLabel = 'None',
  onCommit,
}: ProjectTaskSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const options = property.config?.options ?? []
  const current = typeof value === 'string' ? value : null
  const selected = options.find((option) => option.id === current)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) setOpen((currentOpen) => !currentOpen)
        }}
        className={cn(projectPanelFieldTrigger, !selected && 'text-text-primary/40')}
      >
        {selected ? <SelectPill option={selected} /> : <span>{emptyLabel}</span>}
        {!readOnly ? (
          <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} className="text-text-primary/40" />
        ) : null}
      </button>

      <ProjectPanelPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        minWidth={240}
      >
        <OptionRow
          label={emptyLabel}
          selected={!current}
          onSelect={() => {
            onCommit(null)
            setOpen(false)
          }}
        />
        {options.map((option) => (
          <OptionRow
            key={option.id}
            label={option.label}
            selected={current === option.id}
            option={option}
            onSelect={() => {
              onCommit(option.id)
              setOpen(false)
            }}
          />
        ))}
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
