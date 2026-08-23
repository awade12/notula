import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { cn } from '@/lib/cn'
import { memberInitialsFromName } from './project-task-assignee-field'

type ProjectTaskAssigneeStackProps = {
  members: SpaceMember[]
  maxVisible?: number
  size?: 'sm' | 'md'
  className?: string
}

export function ProjectTaskAssigneeStack({
  members,
  maxVisible = 3,
  size = 'sm',
  className,
}: ProjectTaskAssigneeStackProps) {
  if (members.length === 0) return null

  const visible = members.slice(0, maxVisible)
  const hidden = members.length - visible.length
  const avatarClass = size === 'sm' ? 'size-5 text-[9px]' : 'size-6 text-[10px]'

  return (
    <span className={cn('inline-flex items-center', className)}>
      <span className="flex items-center -space-x-1.5">
        {visible.map((member) => (
          <span
            key={member.userId}
            title={member.name}
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full bg-white/10 font-medium text-text-emphasis ring-2 ring-background',
              avatarClass,
            )}
          >
            {memberInitialsFromName(member.name)}
          </span>
        ))}
      </span>
      {hidden > 0 ? (
        <span
          title={members
            .slice(maxVisible)
            .map((member) => member.name)
            .join(', ')}
          className={cn(
            'ml-1 inline-flex shrink-0 items-center rounded-full bg-white/[0.08] font-medium text-text-primary/55',
            size === 'sm' ? 'size-5 text-[9px]' : 'size-6 text-[10px]',
          )}
        >
          +{hidden}
        </span>
      ) : null}
    </span>
  )
}
