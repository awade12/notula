import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Sidebar } from '@/features/workspace/components/sidebar/sidebar'
import { SidebarCollapseButton } from '@/features/workspace/components/sidebar/sidebar-collapse-button'
import { useSidebarCollapsed } from '@/features/workspace/hooks/use-sidebar-collapsed'
import { SIDEBAR_WIDTH_PX } from '@/features/workspace/lib/sidebar-layout'
import { sidebarWidthSpring } from '@/features/workspace/lib/sidebar-motion'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const collapsed = useSidebarCollapsed()
  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : sidebarWidthSpring

  return (
    <div className="flex h-screen overflow-hidden bg-sidebar p-panel">
      <motion.div
        className="h-full shrink-0 overflow-hidden"
        initial={false}
        animate={{ width: collapsed ? 0 : SIDEBAR_WIDTH_PX }}
        transition={transition}
      >
        <div className="h-full w-sidebar-width">
          <Sidebar />
        </div>
      </motion.div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="scrollbar-none relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel bg-surface p-main text-sm tracking-dashboard text-text-primary">
          {collapsed ? (
            <div className="mb-2 flex h-8 shrink-0 items-center">
              <SidebarCollapseButton
                collapsed
                className="text-text-primary/45 hover:bg-white/[0.04] hover:text-text-primary/75"
              />
            </div>
          ) : null}
          <div className="scrollbar-none flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
