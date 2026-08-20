import { useRef, useState } from 'react'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskCheckIcon, taskChevronDownIcon } from '../lib/project-icon-pack'
import { projectPanelFieldTrigger, projectPanelOption } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'

type ProjectTaskAssigneeFieldProps = {
  value: unknown
  members: SpaceMember[]
  readOnly?: boolean
  onCommit: (userId: string | null) => void
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
  onCommit,
}: ProjectTaskAssigneeFieldProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedId = typeof value === 'string' && value.length > 0 ? value : null
  const selected = members.find((member) => member.userId === selectedId)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) setOpen((current) => !current)
        }}
        className={cn(projectPanelFieldTrigger, !selected && 'text-text-primary/40')}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-text-emphasis">
              {memberInitials(selected.name)}
            </span>
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span>Unassigned</span>
        )}
        {!readOnly ? (
          <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} className="text-text-primary/40" />
        ) : null}
      </button>

      <ProjectPanelPopover
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        minWidth={260}
        className="max-h-64 overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => {
            onCommit(null)
            setOpen(false)
          }}
          className={projectPanelOption(!selectedId)}
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            {!selectedId ? <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} /> : null}
          </span>
          <span>Unassigned</span>
        </button>
        {members.map((member) => (
          <button
            key={member.userId}
            type="button"
            onClick={() => {
              onCommit(member.userId)
              setOpen(false)
            }}
            className={projectPanelOption(selectedId === member.userId)}
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              {selectedId === member.userId ? (
                <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
              ) : null}
            </span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium">
              {memberInitials(member.name)}
            </span>
            <span className="min-w-0 flex-1 truncate">{member.name}</span>
          </button>
        ))}
      </ProjectPanelPopover>
    </>
  )
}

export function resolveAssigneeMember(members: SpaceMember[], value: unknown) {
  if (typeof value !== 'string' || !value) return undefined
  return members.find((member) => member.userId === value)
}

export function memberInitialsFromName(name: string) {
  return memberInitials(name)
}
