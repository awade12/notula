import { ArrowDownUp, CalendarDays, Filter, LayoutGrid, List, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DatabaseSchema } from '@notesapp/shared'
import type { DatabaseView } from '@/features/database/types'
import { DatabaseActiveRules } from '@/features/database/components/database-active-rules'
import { FilterBar } from '@/features/database/components/filters/filter-bar'
import { SortBar } from '@/features/database/components/sorts/sort-bar'
import {
  ProjectBoardLayoutTabs,
  type ProjectBoardLayoutMode,
} from '@/features/projects/components/project-board-layout-tabs'
import { ProjectBoardAiFilter } from '@/features/projects/components/project-board-ai-filter'
import type { TaskAiProperty } from '@/features/projects/lib/task-ai-types'
import { dbPopover, dbToolbarBtn } from '@/features/database/lib/database-classes'

export type { ProjectBoardLayoutMode }

type Panel = 'filter' | 'sort' | null

type ProjectBoardToolbarProps = {
  layoutMode: ProjectBoardLayoutMode
  onLayoutModeChange: (mode: ProjectBoardLayoutMode) => void
  schema: DatabaseSchema
  filters: DatabaseView['config']['filters']
  sorts: DatabaseView['config']['sorts']
  onFiltersChange: (filters: NonNullable<DatabaseView['config']['filters']>) => void
  onSortsChange: (sorts: NonNullable<DatabaseView['config']['sorts']>) => void
  readOnly?: boolean
  taskCount?: number
  totalCount?: number
  aiFilterEnabled?: boolean
  aiFilterProperties?: TaskAiProperty[]
  aiFilterModel?: string
  spaceId?: string
}

const layoutTabs: Array<{
  mode: ProjectBoardLayoutMode
  label: string
  icon: typeof LayoutGrid
}> = [
  { mode: 'board', label: 'Board', icon: LayoutGrid },
  { mode: 'table', label: 'Table', icon: Table2 },
  { mode: 'list', label: 'List', icon: List },
  { mode: 'calendar', label: 'Calendar', icon: CalendarDays },
]

export function ProjectBoardToolbar({
  layoutMode,
  onLayoutModeChange,
  schema,
  filters = [],
  sorts = [],
  onFiltersChange,
  onSortsChange,
  readOnly = false,
  taskCount,
  totalCount,
  aiFilterEnabled = false,
  aiFilterProperties = [],
  aiFilterModel,
  spaceId,
}: ProjectBoardToolbarProps) {
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const rootRef = useRef<HTMLDivElement>(null)

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
    <div ref={rootRef} className="mb-3">
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <ProjectBoardLayoutTabs
          tabs={layoutTabs}
          layoutMode={layoutMode}
          onLayoutModeChange={onLayoutModeChange}
        />

        <div className="flex flex-wrap items-center gap-2">
          {taskCount !== undefined && totalCount !== undefined && totalCount > taskCount ? (
            <span className="text-[11px] tracking-dashboard text-text-primary/40">
              Showing {taskCount} of {totalCount}
            </span>
          ) : null}

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
                  <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
                    {filters.length}
                  </span>
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
                  <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
                    {sorts.length}
                  </span>
                ) : null}
              </button>

              {openPanel ? (
                <div className={dbPopover}>
                  {openPanel === 'filter' ? (
                    <div className="space-y-3">
                      {aiFilterEnabled && spaceId && aiFilterProperties.length > 0 ? (
                        <ProjectBoardAiFilter
                          spaceId={spaceId}
                          properties={aiFilterProperties}
                          model={aiFilterModel}
                          disabled={readOnly}
                          onApply={(filters) => {
                            onFiltersChange(filters)
                            setOpenPanel(null)
                          }}
                        />
                      ) : null}
                      <FilterBar schema={schema} filters={filters} onChange={onFiltersChange} />
                    </div>
                  ) : null}
                  {openPanel === 'sort' ? (
                    <SortBar schema={schema} sorts={sorts} onChange={onSortsChange} />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
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
