import { useLayoutEffect, useRef, useState } from 'react'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { cn } from '@/lib/cn'
import { memberInitialsFromName } from './project-task-assignee-field'

type ProjectPanelAssigneePreviewProps = {
  members: SpaceMember[]
  className?: string
}

const MEMBER_GAP = 6
const AVATAR_WIDTH = 24
const OVERFLOW_BADGE_WIDTH = 28

function measureOverflowBadge(count: number) {
  return Math.max(OVERFLOW_BADGE_WIDTH, 22 + String(count).length * 6)
}

function fitVisibleAssigneeCount(memberCount: number, availableWidth: number, includeName: boolean) {
  if (memberCount === 0) return 0
  if (memberCount === 1 && includeName) return 1

  for (let visible = memberCount; visible >= 1; visible -= 1) {
    const hidden = memberCount - visible
    let used = visible * AVATAR_WIDTH + Math.max(0, visible - 1) * 2
    if (hidden > 0) used += MEMBER_GAP + measureOverflowBadge(hidden)
    if (used <= availableWidth) return visible
  }

  return 1
}

export function ProjectPanelAssigneePreview({ members, className }: ProjectPanelAssigneePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(members.length)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    function updateVisibleCount() {
      const includeName = members.length === 1
      const next = fitVisibleAssigneeCount(members.length, container.clientWidth, includeName)
      setVisibleCount((current) => (current === next ? current : next))
    }

    updateVisibleCount()

    const observer = new ResizeObserver(updateVisibleCount)
    observer.observe(container)

    return () => observer.disconnect()
  }, [members])

  if (members.length === 0) return null

  if (members.length === 1) {
    const member = members[0]!
    return (
      <span className={cn('flex min-w-0 items-center gap-2', className)}>
        <MemberAvatar member={member} />
        <span className="truncate">{member.name}</span>
      </span>
    )
  }

  const hiddenCount = Math.max(0, members.length - visibleCount)
  const visibleMembers = members.slice(0, visibleCount)
  const hiddenMembers = members.slice(visibleCount)

  return (
    <div
      ref={containerRef}
      className={cn('flex min-w-0 flex-1 items-center justify-end gap-1.5', className)}
    >
      <span className="flex items-center -space-x-1.5">
        {visibleMembers.map((member) => (
          <MemberAvatar key={member.userId} member={member} stacked />
        ))}
      </span>
      {hiddenCount > 0 ? (
        <span
          title={hiddenMembers.map((member) => member.name).join(', ')}
          className="inline-flex shrink-0 items-center rounded-md bg-white/[0.06] px-1.5 py-px text-[11px] font-medium text-text-primary/55 ring-1 ring-inset ring-white/[0.06]"
        >
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  )
}

function MemberAvatar({ member, stacked = false }: { member: SpaceMember; stacked?: boolean }) {
  return (
    <span
      title={member.name}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-text-emphasis',
        stacked && 'ring-2 ring-sidebar',
      )}
    >
      {memberInitialsFromName(member.name)}
    </span>
  )
}
