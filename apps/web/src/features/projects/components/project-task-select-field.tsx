import { useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelInlineChevron, projectPanelTriggerClass, type ProjectPanelFieldVariant } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'
import { ProjectPanelSelectMenu, ProjectPanelSelectMenuDivider } from './project-panel-select-menu'
import { ProjectPanelSelectOption } from './project-panel-select-option'
import { ProjectPanelSelectPill } from './project-panel-select-pill'

type ProjectTaskSelectFieldProps = {
  property: PropertyDefinition
  value: unknown
  readOnly?: boolean
  emptyLabel?: string
  variant?: ProjectPanelFieldVariant
  onCommit: (value: unknown) => void
}

export function ProjectTaskSelectField({
  property,
  value,
  readOnly = false,
  emptyLabel = 'None',
  variant = 'field',
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
        data-open={open}
        onClick={() => {
          if (!readOnly) setOpen((currentOpen) => !currentOpen)
        }}
        className={cn(
          projectPanelTriggerClass(variant),
          variant === 'inline' && 'w-auto',
          !selected && 'text-text-primary/40',
        )}
      >
        {selected ? (
          <ProjectPanelSelectPill option={selected} size={variant === 'inline' ? 'compact' : 'default'} />
        ) : (
          <span className="text-xs">{emptyLabel}</span>
        )}
        {!readOnly ? (
          <WorkspaceIcon
            icon={taskChevronDownIcon}
            size={iconSize.section}
            className={variant === 'inline' ? projectPanelInlineChevron : 'text-text-primary/40'}
          />
        ) : null}
      </button>

      <ProjectPanelPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        minWidth={232}
        align={variant === 'inline' ? 'end' : 'start'}
        className="p-0"
      >
        <ProjectPanelSelectMenu>
          <ProjectPanelSelectOption
            label={emptyLabel}
            selected={!current}
            onSelect={() => {
              onCommit(null)
              setOpen(false)
            }}
          />
          {options.length > 0 ? <ProjectPanelSelectMenuDivider /> : null}
          {options.map((option) => (
            <ProjectPanelSelectOption
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
        </ProjectPanelSelectMenu>
      </ProjectPanelPopover>
    </>
  )
}
