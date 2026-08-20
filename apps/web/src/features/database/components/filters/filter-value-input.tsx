import type { FilterRule, PropertyDefinition } from '@notesapp/shared'
import { DatabasePicker } from '@/features/database/components/database-picker'
import { dbSelectPill } from '@/features/database/lib/database-classes'
import { OPERATOR_LABELS } from '@/features/database/lib/filter-operators'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { cn } from '@/lib/cn'

type FilterValueInputProps = {
  property: PropertyDefinition | undefined
  operator: FilterRule['operator']
  value: unknown
  onChange: (value: unknown) => void
}

export function FilterValueInput({ property, operator, value, onChange }: FilterValueInputProps) {
  if (operator.includes('empty')) return null

  if (property?.type === 'select') {
    const options = property.config?.options ?? []
    return (
      <DatabasePicker
        value={typeof value === 'string' ? value : ''}
        onChange={(next) => onChange(next || null)}
        options={[
          { value: '', label: 'Pick an option…' },
          ...options.map((option) => ({ value: option.id, label: option.label })),
        ]}
      />
    )
  }

  if (property?.type === 'checkbox') {
    return (
      <DatabasePicker
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(next) => onChange(next === 'true' ? true : next === 'false' ? false : null)}
        options={[
          { value: '', label: 'Pick a value…' },
          { value: 'true', label: 'Checked' },
          { value: 'false', label: 'Unchecked' },
        ]}
      />
    )
  }

  return (
    <input
      value={String(value ?? '')}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Enter a value…"
      className={cn(
        'w-full rounded-md px-2 py-1.5 text-xs text-text-emphasis outline-none',
        'bg-white/[0.02] ring-1 ring-inset ring-white/8 placeholder:text-text-primary/35',
        'focus:bg-white/[0.04] focus:ring-white/12',
      )}
    />
  )
}

export function FilterValueSummary({
  property,
  operator,
  value,
}: {
  property: PropertyDefinition | undefined
  operator: FilterRule['operator']
  value: unknown
}) {
  if (operator.includes('empty')) {
    return <span className="text-text-primary/50">{OPERATOR_LABELS[operator].toLowerCase()}</span>
  }

  if (property?.type === 'select') {
    const option = property.config?.options?.find((item) => item.id === value)
    if (!option) return <span className="text-text-primary/50">…</span>
    return (
      <span className={cn(dbSelectPill, selectOptionClassName(option.color))}>{option.label}</span>
    )
  }

  if (property?.type === 'checkbox') {
    return (
      <span className="text-text-primary/70">{value === true ? 'Checked' : 'Unchecked'}</span>
    )
  }

  return <span className="truncate text-text-primary/70">{String(value ?? '…')}</span>
}
