import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type ProjectBoardLayoutMode = 'board' | 'table' | 'list' | 'calendar'

type LayoutTab = {
  mode: ProjectBoardLayoutMode
  label: string
  icon: LucideIcon
}

type ProjectBoardLayoutTabsProps = {
  tabs: LayoutTab[]
  layoutMode: ProjectBoardLayoutMode
  onLayoutModeChange: (mode: ProjectBoardLayoutMode) => void
}

const tabSpring = {
  type: 'spring' as const,
  stiffness: 640,
  damping: 42,
  mass: 0.5,
}

export function ProjectBoardLayoutTabs({
  tabs,
  layoutMode,
  onLayoutModeChange,
}: ProjectBoardLayoutTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<ProjectBoardLayoutMode, HTMLButtonElement>())
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })
  const [indicatorReady, setIndicatorReady] = useState(false)

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    const activeTab = tabRefs.current.get(layoutMode)
    if (!container || !activeTab) return

    const containerRect = container.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()
    setIndicator({
      x: tabRect.left - containerRect.left,
      width: tabRect.width,
    })
    setIndicatorReady(true)
  }, [layoutMode])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useLayoutEffect(() => {
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [updateIndicator])

  const handleTabClick = (mode: ProjectBoardLayoutMode) => {
    if (mode === layoutMode) return
    onLayoutModeChange(mode)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-white/[0.07]"
        initial={false}
        animate={{
          x: indicator.x,
          width: indicator.width,
          opacity: indicatorReady ? 1 : 0,
        }}
        transition={tabSpring}
      />

      {tabs.map(({ mode, label, icon: Icon }) => {
        const isActive = layoutMode === mode

        return (
          <button
            key={mode}
            ref={(node) => {
              if (node) tabRefs.current.set(mode, node)
              else tabRefs.current.delete(mode)
            }}
            type="button"
            onClick={() => handleTabClick(mode)}
            className={cn(
              'relative z-10 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-meta transition-colors',
              isActive
                ? 'text-text-emphasis'
                : 'text-text-primary/55 hover:text-text-primary/90',
            )}
          >
            <Icon className="size-3.5 opacity-55" strokeWidth={1.75} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
