import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode, RefObject } from 'react'
import {
  sidebarMenuPanelVariants,
  sidebarMenuSpring,
} from '@/features/workspace/lib/sidebar-motion'
import { cn } from '@/lib/cn'

type SidebarAnchoredMenuPanelProps = {
  open: boolean
  menuRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
  className?: string
  stretch?: boolean
}

export function SidebarAnchoredMenuPanel({
  open,
  menuRef,
  children,
  className,
  stretch = true,
}: SidebarAnchoredMenuPanelProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarMenuSpring

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={menuRef}
          role="menu"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sidebarMenuPanelVariants}
          transition={transition}
          className={cn(
            'absolute top-full z-50 mt-1 min-w-36 origin-top rounded-xl border border-white/10 bg-surface p-1 shadow-xl shadow-black/50 backdrop-blur-md',
            stretch && 'left-0 right-0',
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
