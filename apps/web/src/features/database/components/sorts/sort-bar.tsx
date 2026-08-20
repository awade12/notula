import { Plus, X } from 'lucide-react'
import type { DatabaseSchema, SortRule } from '@notesapp/shared'
import { DatabasePicker } from '@/features/database/components/database-picker'
import { cn } from '@/lib/cn'

type SortBarProps = {
  schema: DatabaseSchema
  sorts: SortRule[]
  onChange: (sorts: SortRule[]) => void
}

export function SortBar({ schema, sorts, onChange }: SortBarProps) {
  const addSort = () => {
    const firstProperty = schema.properties[0]
    if (!firstProperty) return

    onChange([
      ...sorts,
      {
        propertyId: firstProperty.id,
        direction: 'asc',
      },
    ])
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-text-emphasis">Sort</p>
      {sorts.length === 0 ? (
        <p className="text-xs text-text-primary/45">No sorts on this view.</p>
      ) : null}

      {sorts.map((sort, index) => (
        <div
          key={`${sort.propertyId}-${index}`}
          className="grid grid-cols-[1fr_1fr_auto] gap-1.5 rounded-lg bg-white/[0.02] p-2 ring-1 ring-inset ring-white/6"
        >
          <DatabasePicker
            value={sort.propertyId}
            onChange={(propertyId) =>
              onChange(
                sorts.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, propertyId } : item,
                ),
              )
            }
            options={schema.properties.map((property) => ({
              value: property.id,
              label: property.name,
            }))}
          />
          <DatabasePicker
            value={sort.direction}
            onChange={(direction) =>
              onChange(
                sorts.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, direction } : item,
                ),
              )
            }
            options={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' },
            ]}
          />
          <button
            type="button"
            onClick={() => onChange(sorts.filter((_, itemIndex) => itemIndex !== index))}
            className="flex size-8 items-center justify-center rounded-md text-text-primary/40 hover:bg-white/[0.05] hover:text-text-emphasis"
            aria-label="Remove sort"
          >
            <X className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSort}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-text-primary/60',
          'transition-colors hover:bg-white/[0.04] hover:text-text-emphasis',
        )}
      >
        <Plus className="size-3.5" strokeWidth={1.75} />
        Add sort
      </button>
    </div>
  )
}
