import { ArrowDownUp, Filter, LayoutGrid, Plus, Settings2, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DatabaseSchema, PropertyDefinition } from '@notesapp/shared'
import type { DatabaseView } from '@/features/database/types'
import { DatabaseActiveRules } from '@/features/database/components/database-active-rules'
import { FilterBar } from '@/features/database/components/filters/filter-bar'
import { SortBar } from '@/features/database/components/sorts/sort-bar'
import { PropertyList } from '@/features/database/components/schema-editor/property-list'
import { dbPopover, dbToolbarBtn, dbViewTab } from '@/features/database/lib/database-classes'
import { cn } from '@/lib/cn'

type Panel = 'filter' | 'sort' | 'properties' | null

type DatabaseToolbarProps = {
  views: DatabaseView[]
  activeViewId: string
  onSelectView: (viewId: string) => void
  onCreateBoard: () => void
  isCreatingBoard?: boolean
  schema: DatabaseSchema
  properties: PropertyDefinition[]
  visiblePropertyIds: string[]
  onPropertiesChange: (properties: PropertyDefinition[]) => void
  onTogglePropertyVisibility: (propertyId: string) => void
  onAddProperty?: (type: PropertyDefinition['type']) => void
  isSavingProperties?: boolean
  filters: DatabaseView['config']['filters']
  sorts: DatabaseView['config']['sorts']
  onFiltersChange: (filters: NonNullable<DatabaseView['config']['filters']>) => void
  onSortsChange: (sorts: NonNullable<DatabaseView['config']['sorts']>) => void
  readOnly?: boolean
}

export function DatabaseToolbar({
  views,
  activeViewId,
  onSelectView,
  onCreateBoard,
  isCreatingBoard,
  schema,
  properties,
  visiblePropertyIds,
  onPropertiesChange,
  onTogglePropertyVisibility,
  onAddProperty,
  isSavingProperties,
  filters = [],
  sorts = [],
  onFiltersChange,
  onSortsChange,
  readOnly = false,
}: DatabaseToolbarProps) {
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasBoard = views.some((view) => view.type === 'board')

  useEffect(() => {
    if (!openPanel) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenPanel(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openPanel])

  const togglePanel = (panel: Panel) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  return (
    <div ref={rootRef}>
      <div className="relative mb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5">
          {views.map((view) => {
            const isActive = view.id === activeViewId
            const Icon = view.type === 'board' ? LayoutGrid : Table2

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => onSelectView(view.id)}
                className={dbViewTab(isActive)}
              >
                <Icon className="size-3.5 opacity-55" strokeWidth={1.75} />
                {view.title}
              </button>
            )
          })}

          {!hasBoard && !readOnly ? (
            <button
              type="button"
              onClick={onCreateBoard}
              disabled={isCreatingBoard}
              className={cn(dbViewTab(false), 'disabled:opacity-40')}
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
              {isCreatingBoard ? '…' : 'Board'}
            </button>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => togglePanel('filter')}
            className={dbToolbarBtn(openPanel === 'filter' || filters.length > 0)}
          >
            <Filter className="size-3.5" strokeWidth={1.75} />
            Filter
            {filters.length > 0 ? (
              <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{filters.length}</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => togglePanel('sort')}
            className={dbToolbarBtn(openPanel === 'sort' || sorts.length > 0)}
          >
            <ArrowDownUp className="size-3.5" strokeWidth={1.75} />
            Sort
            {sorts.length > 0 ? (
              <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{sorts.length}</span>
            ) : null}
          </button>

          <span className="mx-1.5 h-5 w-px bg-white/8" />

          <button
            type="button"
            onClick={() => togglePanel('properties')}
            className={dbToolbarBtn(openPanel === 'properties')}
            title="Edit properties"
          >
            <Settings2 className="size-3.5" strokeWidth={1.75} />
            Properties
          </button>

          {openPanel ? (
            <div className={dbPopover}>
              {openPanel === 'filter' ? (
                <FilterBar schema={schema} filters={filters} onChange={onFiltersChange} />
              ) : null}
              {openPanel === 'sort' ? (
                <SortBar schema={schema} sorts={sorts} onChange={onSortsChange} />
              ) : null}
              {openPanel === 'properties' ? (
                <PropertyList
                  variant="popover"
                  properties={properties}
                  visiblePropertyIds={visiblePropertyIds}
                  onChange={onPropertiesChange}
                  onToggleVisibility={onTogglePropertyVisibility}
                  onAddProperty={onAddProperty}
                  isSaving={isSavingProperties}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        ) : null}
      </div>

      {!readOnly ? (
        <DatabaseActiveRules
          schema={schema}
          filters={filters}
          sorts={sorts}
          onFiltersChange={onFiltersChange}
          onSortsChange={onSortsChange}
        />
      ) : null}
    </div>
  )
}
