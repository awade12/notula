import { motion, useReducedMotion } from 'framer-motion'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import {
  sidebarCloseIcon,
  sidebarOpenIcon,
} from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { toggleSidebarCollapsed } from '@/features/workspace/stores/sidebar-store'
import { sidebarMotionHover } from '@/features/workspace/lib/sidebar-classes'
import { sidebarMenuButtonTap } from '@/features/workspace/lib/sidebar-motion'

type SidebarCollapseButtonProps = {
  collapsed?: boolean
  className?: string
}

export function SidebarCollapseButton({
  collapsed = false,
  className,
}: SidebarCollapseButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const label = collapsed ? 'Open sidebar' : 'Close sidebar'

  return (
    <motion.button
      type="button"
      onClick={toggleSidebarCollapsed}
      whileTap={prefersReducedMotion ? undefined : sidebarMenuButtonTap}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        sidebarMotionHover(),
        'text-text-inverse/35 hover:bg-white/[0.06] hover:text-text-inverse/80',
        className,
      )}
      aria-label={label}
      title={label}
    >
      <WorkspaceIcon
        icon={collapsed ? sidebarOpenIcon : sidebarCloseIcon}
        size={iconSize.collapse}
        strokeWidth={1.75}
      />
    </motion.button>
  )
}
