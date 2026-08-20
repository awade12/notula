import type { PointerEvent } from 'react'
import { cn } from '@/lib/cn'

type ProjectTaskSidebarResizeHandleProps = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
}

export function ProjectTaskSidebarResizeHandle({ onPointerDown }: ProjectTaskSidebarResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize task sidebar"
      onPointerDown={onPointerDown}
      className={cn(
        'absolute inset-y-0 left-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-none',
        'before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2',
        'before:bg-transparent before:transition-colors hover:before:bg-white/20',
      )}
    />
  )
}
