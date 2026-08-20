import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type DatabaseTitleProps = {
  title: string
  onCommit: (value: string) => void
  readOnly?: boolean
}

function resizeField(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export function DatabaseTitle({ title, onCommit, readOnly = false }: DatabaseTitleProps) {
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState(title)
  const isEmpty = !draft.trim()

  useEffect(() => {
    setDraft(title)
  }, [title])

  useLayoutEffect(() => {
    if (fieldRef.current) resizeField(fieldRef.current)
  }, [draft])

  return (
    <textarea
      ref={fieldRef}
      value={draft}
      readOnly={readOnly}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft.trim() || 'Untitled database')}
      rows={1}
      placeholder="Untitled database"
      aria-label="Database title"
      className={cn(
        'w-full resize-none overflow-hidden bg-transparent px-1 py-1 text-[2rem] font-semibold leading-tight tracking-tight outline-none',
        isEmpty ? 'text-text-primary/50 placeholder:text-text-primary/35' : 'text-text-emphasis',
      )}
      onInput={(event) => resizeField(event.currentTarget)}
    />
  )
}
