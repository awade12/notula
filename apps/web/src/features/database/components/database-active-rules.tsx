import { X } from 'lucide-react'
import type { DatabaseSchema, FilterRule, SortRule } from '@notesapp/shared'
import { findProperty } from '@notesapp/shared'
import { FilterValueSummary } from '@/features/database/components/filters/filter-value-input'
import { OPERATOR_LABELS } from '@/features/database/lib/filter-operators'
import { cn } from '@/lib/cn'

type DatabaseActiveRulesProps = {
  schema: DatabaseSchema
  filters: FilterRule[]
  sorts: SortRule[]
  onFiltersChange: (filters: FilterRule[]) => void
  onSortsChange: (sorts: SortRule[]) => void
}

export function DatabaseActiveRules({
  schema,
  filters,
  sorts,
  onFiltersChange,
  onSortsChange,
}: DatabaseActiveRulesProps) {
  if (filters.length === 0 && sorts.length === 0) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {filters.map((filter) => {
        const property = findProperty(schema.properties, filter.propertyId)
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFiltersChange(filters.filter((item) => item.id !== filter.id))}
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
              'bg-white/[0.04] text-text-primary/70 ring-1 ring-inset ring-white/8',
              'transition-colors hover:bg-white/[0.06] hover:text-text-emphasis',
            )}
            title="Remove filter"
          >
            <span className="truncate text-text-primary/45">{property?.name ?? 'Property'}</span>
            <span className="text-text-primary/35">{OPERATOR_LABELS[filter.operator].toLowerCase()}</span>
            <FilterValueSummary property={property} operator={filter.operator} value={filter.value} />
            <X className="size-3 shrink-0 opacity-50" strokeWidth={1.75} />
          </button>
        )
      })}

      {sorts.map((sort, index) => {
        const property = findProperty(schema.properties, sort.propertyId)
        return (
          <button
            key={`${sort.propertyId}-${index}`}
            type="button"
            onClick={() => onSortsChange(sorts.filter((_, itemIndex) => itemIndex !== index))}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
              'bg-white/[0.04] text-text-primary/70 ring-1 ring-inset ring-white/8',
              'transition-colors hover:bg-white/[0.06] hover:text-text-emphasis',
            )}
            title="Remove sort"
          >
            <span className="text-text-primary/45">Sort</span>
            <span className="truncate">{property?.name ?? 'Property'}</span>
            <span className="text-text-primary/35">
              {sort.direction === 'asc' ? '↑' : '↓'}
            </span>
            <X className="size-3 shrink-0 opacity-50" strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
