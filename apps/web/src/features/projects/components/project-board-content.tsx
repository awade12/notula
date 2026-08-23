import { Link } from '@tanstack/react-router'
import { Settings, Sparkles } from 'lucide-react'
import { findProperty } from '@notesapp/shared'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { DatabaseTitle } from '@/features/database/components/database-title'
import { useUpdateView } from '@/features/database/hooks/use-view-actions'
import { useLoadMoreRows, useRows } from '@/features/database/hooks/use-rows'
import type { Database } from '@/features/database/types'
import type { ConnectionStatus } from '@/features/editor/types'
import { ProjectBoardIdeaToTasksDialog } from '@/features/projects/components/project-board-idea-to-tasks-dialog'
import {
  ProjectBoardToolbar,
  type ProjectBoardLayoutMode,
} from '@/features/projects/components/project-board-toolbar'
import { ProjectDueDateCalendarView } from '@/features/projects/components/project-due-date-calendar-view'
import { ProjectKanbanView } from '@/features/projects/components/project-kanban-view'
import { ProjectTaskListView } from '@/features/projects/components/project-task-list-view'
import { ProjectTaskTableView } from '@/features/projects/components/project-task-table-view'
import { ProjectTaskPanel } from '@/features/projects/components/project-task-panel'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { buildProjectTaskUrl } from '@/features/projects/lib/build-task-url'
import { buildTaskAiPropertySchema } from '@/features/projects/lib/build-task-ai-schema'
import { filterTopLevelTasks } from '@/features/projects/lib/filter-top-level-tasks'
import { useProjectTaskUrlSync } from '@/features/projects/hooks/use-task-url-sync'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { SlidePanelLayout } from '@/components/layout/slide-panel-layout'

const ROWS_PAGE_SIZE = 200
const LAYOUT_PERSIST_MS = 350

function isProjectBoardLayoutMode(value: unknown): value is ProjectBoardLayoutMode {
  return value === 'board' || value === 'table' || value === 'list' || value === 'calendar'
}

type ProjectBoardContentProps = {
  spaceId: string
  boardId: string
  database: Database
  members: SpaceMember[]
  canEdit: boolean
  selectedTaskId?: string
  connectionStatus: ConnectionStatus
  onRename: (title: string) => void
  onUpdateIcon: (icon: string | null) => void
}

export function ProjectBoardContent({
  spaceId,
  boardId,
  database,
  members,
  canEdit,
  selectedTaskId,
  connectionStatus,
  onRename,
  onUpdateIcon,
}: ProjectBoardContentProps) {
  const { data: tree } = usePageTree(spaceId)
  const { data: aiSettings } = useAiSettings()
  const { openTask, closeTask } = useProjectTaskUrlSync(spaceId, boardId)
  const updateView = useUpdateView(spaceId, boardId)
  const queryClient = useQueryClient()
  const layoutPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false)

  const boardView = database.views.find((view) => view.type === 'board') ?? database.views[0]

  const [layoutMode, setLayoutMode] = useState<ProjectBoardLayoutMode>(() => {
    const saved = boardView?.config.layoutMode
    return isProjectBoardLayoutMode(saved) ? saved : 'board'
  })
  const [visitedLayouts, setVisitedLayouts] = useState<Set<ProjectBoardLayoutMode>>(
    () => new Set([isProjectBoardLayoutMode(boardView?.config.layoutMode) ? boardView.config.layoutMode : 'board']),
  )

  useEffect(() => {
    const saved = boardView?.config.layoutMode
    const next = isProjectBoardLayoutMode(saved) ? saved : 'board'
    setLayoutMode(next)
    setVisitedLayouts(new Set([next]))
  }, [boardId, boardView?.id])

  useEffect(() => {
    return () => {
      if (layoutPersistTimerRef.current) clearTimeout(layoutPersistTimerRef.current)
    }
  }, [])

  const activeView = boardView

  const { data: rowsResult, isLoading: rowsLoading } = useRows(spaceId, boardId, {
    filters: activeView?.config.filters,
    sorts: activeView?.config.sorts,
    limit: ROWS_PAGE_SIZE,
  })

  const loadMore = useLoadMoreRows(spaceId, boardId, {
    filters: activeView?.config.filters,
    sorts: activeView?.config.sorts,
    limit: ROWS_PAGE_SIZE,
  })

  const rows = rowsResult?.rows ?? []
  const boardRows = useMemo(() => filterTopLevelTasks(rows), [rows])
  const pages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])

  const groupProperty = useMemo(() => {
    if (!boardView?.config.groupByPropertyId) return undefined
    return findProperty(database.schema.properties, boardView.config.groupByPropertyId)
  }, [boardView, database.schema.properties])

  const titleProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'title'),
    [database.schema.properties],
  )

  const labelProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'label'),
    [database.schema.properties],
  )

  const milestoneProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'milestone'),
    [database.schema.properties],
  )

  const priorityProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'priority'),
    [database.schema.properties],
  )

  const aiFilterProperties = useMemo(
    () => buildTaskAiPropertySchema(database.schema.properties),
    [database.schema.properties],
  )

  const estimateProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'estimate'),
    [database.schema.properties],
  )

  const linkedNoteProperty = useMemo(
    () => database.schema.properties.find((property) => property.id === 'linked_note'),
    [database.schema.properties],
  )

  const selectedTask = useMemo(
    () => (selectedTaskId ? rows.find((row) => row.id === selectedTaskId) : undefined),
    [rows, selectedTaskId],
  )

  useEffect(() => {
    if (selectedTaskId && !rowsLoading && !selectedTask) {
      closeTask()
    }
  }, [closeTask, rowsLoading, selectedTask, selectedTaskId])

  if (!boardView || !groupProperty || groupProperty.type !== 'select' || !titleProperty) {
    return (
      <div className="rounded-lg border border-border/60 bg-white/[0.02] px-4 py-8 text-center">
        <p className="text-sm text-text-emphasis">This board needs a Status column</p>
      </div>
    )
  }

  const hiddenGroupIds = boardView.config.hiddenGroupIds ?? []

  function patchLayoutModeInCache(mode: ProjectBoardLayoutMode) {
    if (!activeView) return

    queryClient.setQueryData<Database>(['database', spaceId, boardId], (current) => {
      if (!current) return current

      return {
        ...current,
        views: current.views.map((view) =>
          view.id === activeView.id
            ? { ...view, config: { ...view.config, layoutMode: mode } }
            : view,
        ),
      }
    })
  }

  function persistViewConfig(patch: Partial<NonNullable<typeof activeView>['config']>) {
    if (!activeView) return
    void updateView.mutateAsync({
      viewId: activeView.id,
      config: {
        ...activeView.config,
        ...patch,
      },
    })
  }

  function handleLayoutModeChange(mode: ProjectBoardLayoutMode) {
    setLayoutMode(mode)
    setVisitedLayouts((current) => {
      if (current.has(mode)) return current
      const next = new Set(current)
      next.add(mode)
      return next
    })
    patchLayoutModeInCache(mode)

    if (layoutPersistTimerRef.current) {
      clearTimeout(layoutPersistTimerRef.current)
    }

    layoutPersistTimerRef.current = setTimeout(() => {
      persistViewConfig({ layoutMode: mode })
    }, LAYOUT_PERSIST_MS)
  }

  function handleOpenTask(taskId: string) {
    openTask(taskId)
  }

  function handleCloseTask() {
    closeTask()
  }

  const panelOpen = Boolean(selectedTask)

  return (
    <SlidePanelLayout
      open={panelOpen}
      panelWidth="min(calc(100vw - 3rem), 960px)"
      contentClassName="flex min-h-full flex-col"
      panel={
        selectedTask ? (
          <ProjectTaskPanel
            spaceId={spaceId}
            boardId={boardId}
            boardTitle={database.title}
            row={selectedTask}
            rows={rows}
            groupProperty={groupProperty}
            titleProperty={titleProperty}
            labelProperty={labelProperty}
            milestoneProperty={milestoneProperty}
            priorityProperty={priorityProperty}
            estimateProperty={estimateProperty}
            linkedNoteProperty={linkedNoteProperty}
            pages={pages}
            members={members}
            readOnly={!canEdit}
            connectionStatus={connectionStatus}
            taskUrl={buildProjectTaskUrl(spaceId, boardId, selectedTask.id)}
            onOpenTask={handleOpenTask}
            onClose={handleCloseTask}
          />
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {canEdit ? (
              <PageIconPicker
                variant="surface"
                align="left"
                value={database.icon}
                onSelect={(icon) => onUpdateIcon(icon)}
                trigger={
                  <span className="mt-2 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.05]">
                    {database.icon ? (
                      <PageIconDisplay value={database.icon} size={22} />
                    ) : (
                      <span className="text-lg text-text-primary/35">📋</span>
                    )}
                  </span>
                }
              />
            ) : (
              <span className="mt-2 flex size-9 shrink-0 items-center justify-center rounded-lg">
                {database.icon ? (
                  <PageIconDisplay value={database.icon} size={22} />
                ) : (
                  <span className="text-lg text-text-primary/35">📋</span>
                )}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <DatabaseTitle
                title={database.title}
                readOnly={!canEdit}
                onCommit={(title) => {
                  if (title !== database.title) onRename(title)
                }}
              />
              <p className="mt-1 px-1 text-xs tracking-dashboard text-text-primary/45">
                Track work by status · click a task for details, labels, dates, and AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && aiSettings?.hasApiKey ? (
              <button
                type="button"
                onClick={() => setIdeaDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs tracking-dashboard text-violet-200 transition-colors hover:bg-violet-500/15"
              >
                <Sparkles className="size-3.5" strokeWidth={1.75} />
                Plan from idea
              </button>
            ) : null}
            <Link
              to="/s/$spaceId/projects/$boardId/settings/status"
              params={{ spaceId, boardId }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs tracking-dashboard text-text-primary/55 transition-colors hover:bg-white/[0.04] hover:text-text-emphasis"
            >
              <Settings className="size-3.5" strokeWidth={1.75} />
              Board settings
            </Link>
          </div>
        </div>

        <ProjectBoardToolbar
          layoutMode={layoutMode}
          onLayoutModeChange={handleLayoutModeChange}
          schema={database.schema}
          filters={activeView?.config.filters ?? []}
          sorts={activeView?.config.sorts ?? []}
          onFiltersChange={(filters) => persistViewConfig({ filters })}
          onSortsChange={(sorts) => persistViewConfig({ sorts })}
          readOnly={!canEdit}
          taskCount={boardRows.length}
          totalCount={rowsResult?.total}
          aiFilterEnabled={Boolean(aiSettings?.hasApiKey)}
          aiFilterProperties={aiFilterProperties}
          aiFilterModel={aiSettings?.defaultModel}
          spaceId={spaceId}
        />

        {rowsLoading ? (
          <p className="text-sm text-text-primary/45">Loading tasks…</p>
        ) : (
          <div className="relative min-h-0 flex-1">
            {visitedLayouts.has('board') ? (
            <div className={layoutMode === 'board' ? 'min-h-0' : 'hidden'} aria-hidden={layoutMode !== 'board'}>
              <ProjectKanbanView
                spaceId={spaceId}
                databaseId={boardId}
                rows={rows}
                groupProperty={groupProperty}
                titleProperty={titleProperty}
                labelProperty={labelProperty}
                milestoneProperty={milestoneProperty}
                priorityProperty={priorityProperty}
                estimateProperty={estimateProperty}
                linkedNoteProperty={linkedNoteProperty}
                pages={pages}
                members={members}
                selectedTaskId={selectedTaskId}
                readOnly={!canEdit}
                hiddenGroupIds={hiddenGroupIds}
                onOpenTask={handleOpenTask}
              />
            </div>
            ) : null}

            {visitedLayouts.has('table') ? (
            <div className={layoutMode === 'table' ? 'min-h-0' : 'hidden'} aria-hidden={layoutMode !== 'table'}>
              <ProjectTaskTableView
                rows={boardRows}
                titlePropertyId={titleProperty.id}
                groupProperty={groupProperty}
                labelProperty={labelProperty}
                priorityProperty={priorityProperty}
                members={members}
                selectedTaskId={selectedTaskId}
                onOpenTask={handleOpenTask}
              />
            </div>
            ) : null}

            {visitedLayouts.has('list') ? (
            <div className={layoutMode === 'list' ? 'min-h-0' : 'hidden'} aria-hidden={layoutMode !== 'list'}>
              <ProjectTaskListView
                rows={boardRows}
                groupProperty={groupProperty}
                titlePropertyId={titleProperty.id}
                selectedTaskId={selectedTaskId}
                onOpenTask={handleOpenTask}
              />
            </div>
            ) : null}

            {visitedLayouts.has('calendar') ? (
            <div
              className={layoutMode === 'calendar' ? 'min-h-0' : 'hidden'}
              aria-hidden={layoutMode !== 'calendar'}
            >
              <ProjectDueDateCalendarView
                rows={boardRows}
                titlePropertyId={titleProperty.id}
                selectedTaskId={selectedTaskId}
                onOpenTask={handleOpenTask}
              />
            </div>
            ) : null}
          </div>
        )}

        {rowsResult?.hasMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              disabled={loadMore.isPending}
              onClick={() => void loadMore.mutateAsync(rows.length)}
              className="rounded-lg border border-border/50 px-4 py-2 text-xs tracking-dashboard text-text-primary/60 transition-colors hover:bg-white/[0.04] hover:text-text-emphasis disabled:opacity-40"
            >
              {loadMore.isPending ? 'Loading…' : `Load more (${rows.length} of ${rowsResult.total})`}
            </button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <ProjectBoardIdeaToTasksDialog
          spaceId={spaceId}
          boardId={boardId}
          boardTitle={database.title}
          schemaProperties={database.schema.properties}
          open={ideaDialogOpen}
          onOpenChange={setIdeaDialogOpen}
        />
      ) : null}
    </SlidePanelLayout>
  )
}
