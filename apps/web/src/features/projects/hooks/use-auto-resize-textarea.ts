import { useCallback, useLayoutEffect, useRef } from 'react'

type UseAutoResizeTextareaOptions = {
  minHeight?: number
  maxHeight?: number
}

export function useAutoResizeTextarea(
  value: string,
  options: UseAutoResizeTextareaOptions = {},
) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const minHeight = options.minHeight ?? 44
  const maxHeight = options.maxHeight ?? 160

  const resize = useCallback(() => {
    const element = ref.current
    if (!element) return

    element.style.height = 'auto'
    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight)
    element.style.height = `${nextHeight}px`
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxHeight, minHeight])

  useLayoutEffect(() => {
    resize()
  }, [resize, value])

  return { ref, resize }
}
