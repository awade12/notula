import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

type PageTitleInputProps = {
  title: string
  onChange: (value: string) => void
  onEnter?: () => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
}

function resizeTitleField(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export function PageTitleInput({
  title,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  readOnly = false,
}: PageTitleInputProps) {
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const isEmpty = !title.trim()

  useLayoutEffect(() => {
    if (fieldRef.current) {
      resizeTitleField(fieldRef.current)
    }
  }, [title])

  return (
    <textarea
      ref={fieldRef}
      value={title ?? ''}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onEnter?.()
        }
      }}
      rows={1}
      placeholder="Untitled"
      aria-label="Page title"
      className={cn(
        'min-h-10 w-full resize-none overflow-hidden bg-transparent px-1 py-0 text-2xl font-medium leading-10 tracking-dashboard outline-none',
        isEmpty ? 'text-text-primary placeholder:text-text-primary/50' : 'text-text-emphasis',
      )}
      onInput={(event) => resizeTitleField(event.currentTarget)}
    />
  )
}
