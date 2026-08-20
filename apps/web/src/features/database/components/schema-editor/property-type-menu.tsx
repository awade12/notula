import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { PropertyTypeIcon } from '@/features/database/lib/property-type-icon'
import { PROPERTY_TYPE_OPTIONS } from '@/features/database/lib/create-property'
import { cn } from '@/lib/cn'

type PropertyTypeMenuProps = {
  onSelect: (type: PropertyDefinition['type']) => void
  autoFocus?: boolean
  className?: string
}

export function PropertyTypeMenu({ onSelect, autoFocus = true, className }: PropertyTypeMenuProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return PROPERTY_TYPE_OPTIONS
    return PROPERTY_TYPE_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.description.toLowerCase().includes(normalized),
    )
  }, [query])

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <Search className="size-3.5 shrink-0 text-text-primary/40" strokeWidth={1.75} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a property type…"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-emphasis outline-none placeholder:text-text-primary/35"
        />
      </div>

      <div className="max-h-64 overflow-y-auto p-1" role="listbox">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-text-primary/40">No matching types</p>
        ) : (
          filtered.map((option) => (
            <button
              key={option.type}
              type="button"
              role="option"
              onClick={() => onSelect(option.type)}
              className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
            >
              <PropertyTypeIcon type={option.type} className="opacity-70" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm text-text-emphasis">{option.label}</span>
                <span className="block text-[11px] text-text-primary/42">{option.description}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
