import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { projectPanelPopoverSurface } from '../lib/project-panel-classes'

type ProjectPanelPopoverProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  children: ReactNode
  className?: string
  minWidth?: number
  align?: 'start' | 'end'
}

type PopoverPosition = {
  top: number
  left: number
  width: number
}

function measurePosition(
  anchor: HTMLElement,
  minWidth: number,
  align: 'start' | 'end',
): PopoverPosition {
  const rect = anchor.getBoundingClientRect()
  const width = Math.max(rect.width, minWidth)
  let left = align === 'end' ? rect.right - width : rect.left
  const maxLeft = window.innerWidth - width - 8
  if (left > maxLeft) left = Math.max(8, maxLeft)
  if (left < 8) left = 8

  const preferredTop = rect.bottom + 6
  const estimatedHeight = 280
  const top =
    preferredTop + estimatedHeight > window.innerHeight - 8
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : preferredTop

  return { top, left, width }
}

export function ProjectPanelPopover({
  open,
  anchorRef,
  onClose,
  children,
  className,
  minWidth = 220,
  align = 'start',
}: ProjectPanelPopoverProps) {
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }

    const anchor = anchorRef.current
    if (!anchor) return

    function updatePosition() {
      const nextAnchor = anchorRef.current
      if (!nextAnchor) return
      setPosition(measurePosition(nextAnchor, minWidth, align))
    }

    updatePosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      onClose()
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [align, anchorRef, minWidth, onClose, open])

  if (!open || !position || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={popoverRef}
      className={cn(projectPanelPopoverSurface, className)}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 200,
      }}
    >
      {children}
    </div>,
    document.body,
  )
}
