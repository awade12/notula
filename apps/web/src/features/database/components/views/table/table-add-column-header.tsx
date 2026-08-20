import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { PropertyTypeMenu } from '@/features/database/components/schema-editor/property-type-menu'
import { dbAddColumnBtn, dbAddPropertyPopover } from '@/features/database/lib/database-classes'

type TableAddColumnHeaderProps = {
  onAddProperty: (type: PropertyDefinition['type']) => void
}

export function TableAddColumnHeader({ onAddProperty }: TableAddColumnHeaderProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={dbAddColumnBtn(open)}
        aria-label="Add property"
        aria-expanded={open}
        title="Add property"
      >
        <Plus className="size-3.5" strokeWidth={1.75} />
      </button>

      {open ? (
        <div className={dbAddPropertyPopover}>
          <PropertyTypeMenu
            onSelect={(type) => {
              onAddProperty(type)
              setOpen(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
