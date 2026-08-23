import { useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { normalizeMultiSelectValue } from '@notesapp/shared'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelInlineChevron, projectPanelTriggerClass, type ProjectPanelFieldVariant } from '../lib/project-panel-classes'
import { ProjectPanelLabelPreview } from './project-panel-label-preview'
import { ProjectPanelPopover } from './project-panel-popover'
import { ProjectPanelSelectMenu } from './project-panel-select-menu'
import { ProjectPanelSelectOption } from './project-panel-select-option'
import { ProjectPanelSelectPill } from './project-panel-select-pill'

type ProjectTaskMultiSelectFieldProps = {
  property: PropertyDefinition
  value: unknown
  readOnly?: boolean
  emptyLabel?: string
  variant?: ProjectPanelFieldVariant
  onCommit: (value: unknown) => void
}

export function ProjectTaskMultiSelectField({
  property,
  value,
  readOnly = false,
  emptyLabel = 'Add labels',
  variant = 'field',
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
        data-open={open}
        onClick={() => {
          if (!readOnly) setOpen((currentOpen) => !currentOpen)
        }}
        className={cn(
          projectPanelTriggerClass(variant),
          variant === 'field' && 'min-h-9 h-auto flex-wrap gap-1 py-1.5',
          variant === 'inline' && 'relative h-auto w-full min-w-0 items-start gap-1',
          selectedOptions.length === 0 && 'text-text-primary/40',
        )}
      >
        {selectedOptions.length > 0 ? (
          variant === 'inline' ? (
            <ProjectPanelLabelPreview options={selectedOptions} />
          ) : (
            <span className="flex max-w-full flex-wrap items-center gap-1">
              {selectedOptions.map((option) => (
                <ProjectPanelSelectPill key={option.id} option={option} size="compact" />
              ))}
            </span>
          )
        ) : (
          <span className="text-xs">{emptyLabel}</span>
        )}
        {!readOnly ? (
          <WorkspaceIcon
            icon={taskChevronDownIcon}
            size={iconSize.section}
            className={cn(
              'shrink-0',
              variant === 'inline'
                ? cn(projectPanelInlineChevron, 'mt-0.5')
                : 'ml-auto text-text-primary/40',
            )}
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
        <ProjectPanelSelectMenu
          footer={
            selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onCommit([])
                  setOpen(false)
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs text-text-primary/45 transition-colors hover:bg-white/[0.04] hover:text-text-primary/70"
              >
                Clear all
              </button>
            ) : null
          }
        >
          {options.map((option) => (
            <ProjectPanelSelectOption
              key={option.id}
              label={option.label}
              selected={selectedIds.includes(option.id)}
              option={option}
              mode="multi"
              onSelect={() => toggleOption(option.id)}
            />
          ))}
        </ProjectPanelSelectMenu>
      </ProjectPanelPopover>
    </>
  )
}
