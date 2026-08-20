import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { getPropertyLabel } from '@notesapp/shared'
import { PropertyTypeIcon } from '@/features/database/lib/property-type-icon'
import { createPropertyDefinition } from '@/features/database/lib/create-property'
import { cn } from '@/lib/cn'
import { PropertyTypeMenu } from './property-type-menu'

type PropertyListProps = {
  properties: PropertyDefinition[]
  visiblePropertyIds: string[]
  onChange: (properties: PropertyDefinition[]) => void
  onToggleVisibility: (propertyId: string) => void
  onAddProperty?: (type: PropertyDefinition['type']) => void
  isSaving?: boolean
  variant?: 'inline' | 'popover'
}

export function PropertyList({
  properties,
  visiblePropertyIds,
  onChange,
  onToggleVisibility,
  onAddProperty,
  isSaving,
  variant = 'inline',
}: PropertyListProps) {
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraftNames(Object.fromEntries(properties.map((property) => [property.id, property.name])))
  }, [properties])

  const commitNames = () => {
    onChange(
      properties.map((property) => ({
        ...property,
        name: draftNames[property.id]?.trim() || property.name,
      })),
    )
  }

  const removeProperty = (propertyId: string) => {
    if (propertyId === 'title') return
    if (properties.length <= 1) return
    onChange(properties.filter((property) => property.id !== propertyId))
  }

  const handleAddProperty = (type: PropertyDefinition['type']) => {
    if (onAddProperty) {
      onAddProperty(type)
      return
    }
    onChange([...properties, createPropertyDefinition(type)])
  }

  return (
    <div className={cn(variant === 'inline' && 'rounded-xl border border-border bg-white/[0.015] p-3')}>
      <div className={cn('flex items-center justify-between gap-3', variant === 'popover' ? 'mb-2' : 'mb-3')}>
        <div>
          <h3 className="text-sm font-medium text-text-emphasis">Properties</h3>
          <p className="text-xs text-text-primary/55">Show, hide, rename, or add columns</p>
        </div>
        {isSaving ? <span className="text-xs text-text-primary/45">Saving…</span> : null}
      </div>

      <div className="space-y-0.5">
        {properties.map((property) => {
          const visible = visiblePropertyIds.includes(property.id)
          const isTitle = property.id === 'title'

          return (
            <div
              key={property.id}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-white/[0.03]',
                !visible && 'opacity-50',
              )}
            >
              <button
                type="button"
                disabled={isTitle}
                onClick={() => onToggleVisibility(property.id)}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-text-primary/40',
                  'hover:bg-white/[0.05] hover:text-text-emphasis disabled:cursor-default disabled:opacity-30',
                )}
                aria-label={visible ? `Hide ${property.name}` : `Show ${property.name}`}
                title={isTitle ? 'Name is always visible' : visible ? 'Hide in this view' : 'Show in this view'}
              >
                {visible ? (
                  <Eye className="size-3.5" strokeWidth={1.75} />
                ) : (
                  <EyeOff className="size-3.5" strokeWidth={1.75} />
                )}
              </button>
              <PropertyTypeIcon type={property.type} />
              <input
                value={draftNames[property.id] ?? property.name}
                onChange={(event) =>
                  setDraftNames((current) => ({
                    ...current,
                    [property.id]: event.target.value,
                  }))
                }
                onBlur={commitNames}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
                className="min-w-0 flex-1 rounded-sm bg-transparent px-1 py-1 text-sm text-text-emphasis outline-none focus:bg-white/[0.04]"
              />
              <span className="shrink-0 text-[10px] text-text-primary/40">
                {getPropertyLabel(property.type)}
              </span>
              <button
                type="button"
                disabled={isTitle || properties.length <= 1}
                onClick={() => removeProperty(property.id)}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-text-primary/30',
                  'hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20',
                )}
                aria-label={`Remove ${property.name}`}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          )
        })}
      </div>

      <div className={cn('border-t border-border/60 pt-2', variant === 'popover' ? 'mt-2' : 'mt-3')}>
        <PropertyTypeMenu onSelect={handleAddProperty} autoFocus={false} />
      </div>
    </div>
  )
}
