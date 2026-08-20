import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { dbRowGutter } from '@/features/database/lib/database-classes'

type TableRowGutterProps = {
  onDelete: () => void
}

export function TableRowGutter({ onDelete }: TableRowGutterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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
    <div ref={rootRef} className={cn(dbRowGutter, 'relative')}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex size-7 items-center justify-center rounded-md text-text-primary/25',
          'opacity-0 transition-opacity group-hover/row:opacity-100',
          open && 'bg-white/[0.06] text-text-primary/60 opacity-100',
        )}
        aria-label="Row actions"
      >
        <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
      </button>

      {open ? (
        <div className="absolute left-full top-0 z-30 ml-1 min-w-[8rem] rounded-lg border border-border bg-background p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            Delete row
          </button>
        </div>
      ) : null}
    </div>
  )
}
