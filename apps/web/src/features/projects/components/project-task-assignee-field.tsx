import { useRef, useState } from 'react'
import { normalizeAssigneeValue } from '@notesapp/shared'
import { Check } from 'lucide-react'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelInlineChevron, projectPanelTriggerClass, type ProjectPanelFieldVariant } from '../lib/project-panel-classes'
import { ProjectPanelAssigneePreview } from './project-panel-assignee-preview'
import { ProjectPanelPopover } from './project-panel-popover'
import { ProjectPanelSelectMenu } from './project-panel-select-menu'

type ProjectTaskAssigneeFieldProps = {
  value: unknown
  members: SpaceMember[]
  readOnly?: boolean
  variant?: ProjectPanelFieldVariant
  onCommit: (userIds: string[]) => void
}

function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProjectTaskAssigneeField({
  value,
  members,
  readOnly = false,
  variant = 'field',
  onCommit,
}: ProjectTaskAssigneeFieldProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedIds = normalizeAssigneeValue(value)
  const selectedMembers = selectedIds
    .map((userId) => members.find((member) => member.userId === userId))
    .filter((member): member is SpaceMember => Boolean(member))

  function toggleMember(userId: string) {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId]
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
          if (!readOnly) setOpen((current) => !current)
        }}
        className={cn(
          projectPanelTriggerClass(variant),
          variant === 'field' && 'min-h-9 h-auto flex-wrap gap-1 py-1.5',
          variant === 'inline' && 'relative h-auto w-full min-w-0 items-start gap-1',
          selectedMembers.length === 0 && 'text-text-primary/40',
        )}
      >
        {selectedMembers.length > 0 ? (
          variant === 'inline' ? (
            <ProjectPanelAssigneePreview members={selectedMembers} />
          ) : (
            <span className="flex max-w-full flex-wrap items-center gap-1.5">
              {selectedMembers.map((member) => (
                <span key={member.userId} className="flex min-w-0 items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-text-emphasis">
                    {memberInitials(member.name)}
                  </span>
                  <span className="truncate">{member.name}</span>
                </span>
              ))}
            </span>
          )
        ) : (
          <span className="text-xs">Unassigned</span>
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
        minWidth={240}
        align={variant === 'inline' ? 'end' : 'start'}
        className="max-h-64 overflow-y-auto p-0"
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
          {members.map((member) => {
            const selected = selectedIds.includes(member.userId)
            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => toggleMember(member.userId)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                  'hover:bg-white/[0.04] active:bg-white/[0.07]',
                  selected && 'bg-white/[0.03]',
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-text-emphasis">
                  {memberInitials(member.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary/80">{member.name}</span>
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                    selected
                      ? 'border-white/25 bg-white/15 text-text-emphasis'
                      : 'border-white/10 bg-transparent text-transparent',
                  )}
                >
                  {selected ? <Check className="size-2.5" strokeWidth={2.5} /> : null}
                </span>
              </button>
            )
          })}
        </ProjectPanelSelectMenu>
      </ProjectPanelPopover>
    </>
  )
}

export function resolveAssigneeMembers(members: SpaceMember[], value: unknown) {
  const ids = normalizeAssigneeValue(value)
  return ids
    .map((userId) => members.find((member) => member.userId === userId))
    .filter((member): member is SpaceMember => Boolean(member))
}

export function resolveAssigneeMember(members: SpaceMember[], value: unknown) {
  return resolveAssigneeMembers(members, value)[0]
}

export function memberInitialsFromName(name: string) {
  return memberInitials(name)
}
