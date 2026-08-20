import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SlidePanelLayoutProps = {
  open: boolean
  panel: ReactNode
  toggle?: ReactNode
  children: ReactNode
  contentClassName?: string
  panelWidth?: string
}

const MAIN_EDGE_INSET = 'var(--spacing-panel)'

export function SlidePanelLayout({
  open,
  panel,
  toggle,
  children,
  contentClassName,
  panelWidth = 'min(calc(100vw-3rem),380px)',
}: SlidePanelLayoutProps) {
  return (
    <>
      <div className={cn('relative w-full', contentClassName)}>{children}</div>

      {toggle ? (
        <div className="fixed z-50" style={{ top: MAIN_EDGE_INSET, right: MAIN_EDGE_INSET }}>
          {toggle}
        </div>
      ) : null}

      <div
        className={cn(
          'fixed z-40 overflow-hidden',
          'rounded-panel border border-border bg-sidebar',
          'shadow-[0_8px_32px_rgb(0_0_0/0.35)]',
          'transition-[transform,opacity] duration-300 ease-[var(--ease-sidebar-expand)]',
          open ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0',
        )}
        style={{
          top: MAIN_EDGE_INSET,
          right: MAIN_EDGE_INSET,
          bottom: MAIN_EDGE_INSET,
          width: panelWidth,
        }}
        aria-hidden={!open}
      >
        <div className="h-full min-h-0">{panel}</div>
      </div>
    </>
  )
}
