import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const STORAGE_KEY = 'notesapp:task-sidebar-width'
const DEFAULT_WIDTH = 320
const MIN_WIDTH = 260
const MAX_WIDTH = 560

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value))
}

function readStoredWidth() {
  if (typeof window === 'undefined') return DEFAULT_WIDTH
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return DEFAULT_WIDTH
  const parsed = Number(stored)
  return Number.isFinite(parsed) ? clampWidth(parsed) : DEFAULT_WIDTH
}

export function useTaskSidebarWidth() {
  const [width, setWidth] = useState(readStoredWidth)
  const widthRef = useRef(width)
  widthRef.current = width

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  const onResizePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = widthRef.current

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      const next = clampWidth(startWidth + (startX - moveEvent.clientX))
      setWidth(next)
    }

    function handlePointerUp() {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [])

  return { width, onResizePointerDown }
}
