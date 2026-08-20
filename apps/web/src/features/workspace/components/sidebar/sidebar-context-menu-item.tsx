import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import {
  sidebarMenuItemSpring,
  sidebarMenuItemVariants,
  sidebarMenuListVariants,
} from '@/features/workspace/lib/sidebar-motion'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'

type SidebarContextMenuItemProps = {
  icon: WorkspaceIconDefinition
  altIcon?: WorkspaceIconDefinition
  showAlt?: boolean
  label: string
  onClick: () => void
  destructive?: boolean
  tone?: 'default' | 'accent'
}

export function SidebarContextMenuDivider() {
  return <div className="my-1 h-px bg-white/8" role="separator" />
}

export function SidebarContextMenuList({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={prefersReducedMotion ? undefined : sidebarMenuListVariants}
    >
      {children}
    </motion.div>
  )
}

export function SidebarContextMenuItem({
  icon,
  altIcon,
  showAlt = false,
  label,
  onClick,
  destructive = false,
  tone = 'default',
}: SidebarContextMenuItemProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarMenuItemSpring

  return (
    <motion.button
      type="button"
      role="menuitem"
      variants={sidebarMenuItemVariants}
      transition={transition}
      onClick={onClick}
      whileHover={prefersReducedMotion ? undefined : { x: 2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs tracking-dashboard outline-none',
        destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : tone === 'accent'
            ? 'text-amber-300/90 hover:bg-amber-500/10'
            : 'text-text-inverse/75 hover:bg-white/[0.06] hover:text-text-inverse',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md',
          destructive
            ? 'bg-red-500/10 text-red-400'
            : tone === 'accent'
              ? 'bg-amber-500/10 text-amber-300'
              : 'bg-white/[0.06] text-text-inverse/55',
        )}
      >
        <SidebarIcon
          icon={icon}
          altIcon={altIcon}
          showAlt={showAlt}
          size={iconSize.menu}
          strokeWidth={1.75}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </motion.button>
  )
}
