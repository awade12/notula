import { useCallback, useEffect, useRef, useState } from 'react'

type FloatingCoords = {
  top: number
  left: number
}

type MenuPositionMode = 'anchor' | 'pointer'

type UseSidebarFloatingMenuOptions = {
  menuWidth?: number
  menuHeight?: number
  offset?: number
}

function clampMenuPosition(
  pointerX: number,
  pointerY: number,
  menuWidth: number,
  menuHeight: number,
) {
  let left = pointerX
  let top = pointerY

  if (left + menuWidth > window.innerWidth - 8) {
    left = pointerX - menuWidth
  }

  if (top + menuHeight > window.innerHeight - 8) {
    top = pointerY - menuHeight
  }

  return {
    left: Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8)),
    top: Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8)),
  }
}

export function useSidebarFloatingMenu({
  menuWidth = 192,
  menuHeight = 280,
  offset = 4,
}: UseSidebarFloatingMenuOptions = {}) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<FloatingCoords | null>(null)
  const [positionMode, setPositionMode] = useState<MenuPositionMode>('anchor')
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

  const updateCoords = useCallback(() => {
    if (positionMode === 'pointer' && pointer) {
      setCoords(clampMenuPosition(pointer.x, pointer.y, menuWidth, menuHeight))
      return
    }

    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    )

    const belowTop = rect.bottom + offset
    const aboveTop = rect.top - menuHeight - offset
    const fitsBelow = belowTop + menuHeight <= window.innerHeight - 8
    const top = fitsBelow ? belowTop : Math.max(8, aboveTop)

    setCoords({ top, left })
  }, [menuHeight, menuWidth, offset, pointer, positionMode])

  useEffect(() => {
    if (!open) return
    updateCoords()

    function handleLayoutChange() {
      updateCoords()
    }

    window.addEventListener('scroll', handleLayoutChange, true)
    window.addEventListener('resize', handleLayoutChange)
    return () => {
      window.removeEventListener('scroll', handleLayoutChange, true)
      window.removeEventListener('resize', handleLayoutChange)
    }
  }, [open, updateCoords])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function close() {
    setOpen(false)
    setPointer(null)
    setPositionMode('anchor')
  }

  function openFromAnchor() {
    setPointer(null)
    setPositionMode('anchor')
    setOpen(true)
  }

  function openAt(x: number, y: number) {
    setPointer({ x, y })
    setPositionMode('pointer')
    setOpen(true)
  }

  function toggle() {
    if (open) {
      close()
      return
    }
    openFromAnchor()
  }

  return {
    anchorRef,
    menuRef,
    open,
    setOpen,
    coords,
    toggle,
    close,
    openAt,
    openFromAnchor,
  }
}
