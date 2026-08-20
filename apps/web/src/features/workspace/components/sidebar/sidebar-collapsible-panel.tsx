import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { sidebarExpandSpring } from '@/features/workspace/lib/sidebar-motion'
import { cn } from '@/lib/cn'

type SidebarCollapsiblePanelProps = {
  expanded: boolean
  children: ReactNode
  className?: string
  innerClassName?: string
}

export function SidebarCollapsiblePanel({
  expanded,
  children,
  className,
  innerClassName,
}: SidebarCollapsiblePanelProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarExpandSpring

  return (
    <motion.div
      initial={false}
      animate={{
        height: expanded ? 'auto' : 0,
        opacity: expanded ? 1 : 0,
      }}
      transition={transition}
      aria-hidden={!expanded}
      className={cn('overflow-hidden', className)}
      style={{ pointerEvents: expanded ? undefined : 'none' }}
    >
      <div className={cn('min-h-0', innerClassName)}>{children}</div>
    </motion.div>
  )
}
