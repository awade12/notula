import { Plus, X } from 'lucide-react'
import type { DatabaseSchema, FilterRule } from '@notesapp/shared'
import { findProperty } from '@notesapp/shared'
import { DatabasePicker } from '@/features/database/components/database-picker'
import {
  getOperatorsForProperty,
  OPERATOR_LABELS,
  operatorNeedsValue,
} from '@/features/database/lib/filter-operators'
import { cn } from '@/lib/cn'
import { FilterValueInput } from './filter-value-input'

type FilterBarProps = {
  schema: DatabaseSchema
  filters: FilterRule[]
  onChange: (filters: FilterRule[]) => void
}

export function FilterBar({ schema, filters, onChange }: FilterBarProps) {
  const addFilter = () => {
    const firstProperty = schema.properties[0]
    if (!firstProperty) return

    onChange([
      ...filters,
      {
        id: crypto.randomUUID(),
        propertyId: firstProperty.id,
        operator: firstProperty.type === 'text' ? 'contains' : 'is',
        value: firstProperty.type === 'checkbox' ? true : '',
      },
    ])
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-text-emphasis">Filters</p>
      {filters.length === 0 ? (
        <p className="text-xs text-text-primary/45">No filters on this view.</p>
      ) : null}

      {filters.map((filter) => {
        const property = findProperty(schema.properties, filter.propertyId)
        const operators = getOperatorsForProperty(property)

        return (
          <div
            key={filter.id}
            className="space-y-1.5 rounded-lg bg-white/[0.02] p-2 ring-1 ring-inset ring-white/6"
          >
            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
              <DatabasePicker
                value={filter.propertyId}
                onChange={(propertyId) => {
                  const nextProperty = findProperty(schema.properties, propertyId)
                  onChange(
                    filters.map((item) =>
                      item.id === filter.id
                        ? {
                            ...item,
                            propertyId,
                            operator:
                              nextProperty?.type === 'text'
                                ? 'contains'
                                : nextProperty?.type === 'checkbox'
                                  ? 'is'
                                  : 'is',
                            value:
                              nextProperty?.type === 'checkbox'
                                ? true
                                : nextProperty?.type === 'select'
                                  ? null
                                  : '',
                          }
                        : item,
                    ),
                  )
                }}
                options={schema.properties.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
              <DatabasePicker
                value={filter.operator}
                onChange={(operator) =>
                  onChange(
                    filters.map((item) =>
                      item.id === filter.id ? { ...item, operator } : item,
                    ),
                  )
                }
                options={operators.map((operator) => ({
                  value: operator,
                  label: OPERATOR_LABELS[operator],
                }))}
              />
              <button
                type="button"
                onClick={() => onChange(filters.filter((item) => item.id !== filter.id))}
                className="flex size-8 items-center justify-center rounded-md text-text-primary/40 hover:bg-white/[0.05] hover:text-text-emphasis"
                aria-label="Remove filter"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>

            {operatorNeedsValue(filter.operator) ? (
              <FilterValueInput
                property={property}
                operator={filter.operator}
                value={filter.value}
                onChange={(value) =>
                  onChange(
                    filters.map((item) => (item.id === filter.id ? { ...item, value } : item)),
                  )
                }
              />
            ) : null}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addFilter}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-text-primary/60',
          'transition-colors hover:bg-white/[0.04] hover:text-text-emphasis',
        )}
      >
        <Plus className="size-3.5" strokeWidth={1.75} />
        Add filter
      </button>
    </div>
  )
}
