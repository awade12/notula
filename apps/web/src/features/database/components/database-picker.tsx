import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type DatabasePickerOption<T extends string> = {
  value: T
  label: string
}

type DatabasePickerProps<T extends string> = {
  value: T
  options: DatabasePickerOption<T>[]
  onChange: (value: T) => void
  className?: string
  align?: 'left' | 'right'
}

export function DatabasePicker<T extends string>({
  value,
  options,
  onChange,
  className,
  align = 'left',
}: DatabasePickerProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs',
          'bg-white/[0.02] text-text-emphasis ring-1 ring-inset ring-white/8 transition-colors',
          'hover:bg-white/[0.04] hover:ring-white/12',
          open && 'bg-white/[0.04] ring-white/12',
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown className="size-3 shrink-0 text-text-primary/40" strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute top-[calc(100%+0.25rem)] z-50 max-h-48 min-w-full overflow-y-auto rounded-lg',
            'border border-white/8 bg-surface-muted p-1 shadow-2xl',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                option.value === value
                  ? 'bg-white/[0.06] text-text-emphasis'
                  : 'text-text-primary/75 hover:bg-white/[0.04]',
              )}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {option.value === value ? <Check className="size-3" strokeWidth={2} /> : null}
              </span>
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
