import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { ReactNode, RefObject } from 'react'
import {
  sidebarMenuPanelVariants,
  sidebarMenuSpring,
} from '@/features/workspace/lib/sidebar-motion'
import { cn } from '@/lib/cn'

type SidebarFloatingMenuPanelProps = {
  open: boolean
  coords: { top: number; left: number } | null
  menuRef: RefObject<HTMLDivElement | null>
  width?: number
  children: ReactNode
  className?: string
}

export function SidebarFloatingMenuPanel({
  open,
  coords,
  menuRef,
  width = 192,
  children,
  className,
}: SidebarFloatingMenuPanelProps) {
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarMenuSpring

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && coords ? (
        <motion.div
          ref={menuRef}
          role="menu"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sidebarMenuPanelVariants}
          transition={transition}
          className={cn(
            'fixed z-50 origin-top rounded-xl border border-white/10 bg-surface p-1 shadow-xl shadow-black/50 backdrop-blur-md',
            className,
          )}
          style={{ top: coords.top, left: coords.left, width }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
