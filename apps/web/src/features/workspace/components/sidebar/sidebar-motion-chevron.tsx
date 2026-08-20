import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'

type SidebarMotionChevronProps = {
  icon: WorkspaceIconDefinition
  expanded: boolean
  size: number
  strokeWidth?: number
  className?: string
  expandedRotate?: number
}

export function SidebarMotionChevron({
  icon,
  expanded,
  size,
  strokeWidth = 2,
  className,
  expandedRotate = 90,
}: SidebarMotionChevronProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none',
        className,
      )}
      style={{ transform: expanded ? `rotate(${expandedRotate}deg)` : 'rotate(0deg)' }}
      aria-hidden
    >
      <WorkspaceIcon icon={icon} size={size} strokeWidth={strokeWidth} />
    </span>
  )
}
