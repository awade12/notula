import { motion, useReducedMotion } from 'framer-motion'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { sidebarExpandSpring } from '@/features/workspace/lib/sidebar-motion'
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
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarExpandSpring

  return (
    <motion.span
      initial={false}
      animate={{ rotate: expanded ? expandedRotate : 0 }}
      transition={transition}
      className={cn('inline-flex shrink-0', className)}
      aria-hidden
    >
      <WorkspaceIcon icon={icon} size={size} strokeWidth={strokeWidth} />
    </motion.span>
  )
}
