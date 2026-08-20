import { useEffect, useRef, useState } from 'react'
import type { PropertyDefinition, SelectOption } from '@notesapp/shared'
import { Check, ChevronDown } from 'lucide-react'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { dbCellDisplay, dbSelectPill } from '@/features/database/lib/database-classes'
import { cn } from '@/lib/cn'

type SelectCellProps = {
  rowId: string
  propertyId: string
  property: PropertyDefinition
  value: unknown
  onCommit: (value: unknown) => void
  readOnly?: boolean
}

export function SelectCell({ property, value, onCommit, readOnly = false }: SelectCellProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options = property.config?.options ?? []
  const current = typeof value === 'string' ? value : null
  const selected = options.find((option) => option.id === current)

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
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        data-open={open}
        onClick={() => {
          if (readOnly) return
          setOpen((currentOpen) => !currentOpen)
        }}
        className={cn('group/select', dbCellDisplay, 'min-w-0 w-full items-center justify-between gap-2')}
      >
        {selected ? (
          <SelectPill option={selected} />
        ) : (
          <span className="text-sm text-text-primary/30">Empty</span>
        )}
        <ChevronDown
          className="size-3 shrink-0 text-text-primary/35 opacity-0 transition-opacity group-hover/select:opacity-100 group-data-[open=true]/select:opacity-100"
          strokeWidth={1.75}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-border bg-background p-1 shadow-lg">
          <OptionRow
            label="Empty"
            selected={!current}
            onSelect={() => {
              onCommit(null)
              setOpen(false)
            }}
          />
          {options.map((option) => (
            <OptionRow
              key={option.id}
              label={option.label}
              selected={current === option.id}
              option={option}
              onSelect={() => {
                onCommit(option.id)
                setOpen(false)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SelectPill({ option }: { option: SelectOption }) {
  return (
    <span className={cn(dbSelectPill, 'truncate', selectOptionClassName(option.color))}>
      {option.label}
    </span>
  )
}

function OptionRow({
  label,
  selected,
  option,
  onSelect,
}: {
  label: string
  selected: boolean
  option?: SelectOption
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        selected ? 'bg-white/[0.06] text-text-emphasis' : 'text-text-primary/75 hover:bg-white/[0.04]',
      )}
    >
      <span className="flex size-4 items-center justify-center">
        {selected ? <Check className="size-3" strokeWidth={2} /> : null}
      </span>
      {option ? <SelectPill option={option} /> : <span className="text-text-primary/45">{label}</span>}
    </button>
  )
}
