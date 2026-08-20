import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

type PageTreeRowRenameInputProps = {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  isActive?: boolean
}

export function PageTreeRowRenameInput({
  value,
  onChange,
  onCommit,
  onCancel,
  isActive = false,
}: PageTreeRowRenameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return

    input.focus()
    input.select()
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => onCommit()}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') {
          event.preventDefault()
          onCommit()
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      className={cn(
        'min-w-0 flex-1 rounded-md border border-white/20 bg-sidebar px-1.5 py-0.5',
        'text-xs leading-4 tracking-dashboard text-text-inverse outline-none',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus:border-white/30',
        isActive && 'font-medium',
      )}
      aria-label="Rename page"
    />
  )
}
