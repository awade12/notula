import type { PropertyDefinition } from '@notesapp/shared'
import { normalizeMultiSelectValue } from '@notesapp/shared'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { cn } from '@/lib/cn'

type MultiSelectCellProps = {
  property: PropertyDefinition
  value: unknown
  readOnly?: boolean
}

export function MultiSelectCell({ property, value, readOnly = false }: MultiSelectCellProps) {
  const ids = normalizeMultiSelectValue(value)
  const options = property.config?.options ?? []
  const selected = ids
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))

  return (
    <div
      className={cn(
        'flex min-h-8 flex-wrap items-center gap-1 px-2.5 py-1',
        readOnly && 'opacity-80',
      )}
    >
      {selected.length > 0 ? (
        selected.map((option) => (
          <span
            key={option.id}
            className={cn('rounded px-1.5 py-0.5 text-[10px]', selectOptionClassName(option.color))}
          >
            {option.label}
          </span>
        ))
      ) : (
        <span className="text-xs text-text-primary/35">—</span>
      )}
    </div>
  )
}
