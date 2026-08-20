import { Link } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { findProperty, mergeProjectBoardSchema, projectBoardSchemaNeedsMerge } from '@notesapp/shared'
import { useEffect, useMemo, useState } from 'react'
import { SlidePanelLayout } from '@/components/layout/slide-panel-layout'
import { useDatabase } from '@/features/database/hooks/use-database'
import { useDatabaseActions } from '@/features/database/hooks/use-database-actions'
import { useDatabaseCollabProvider } from '@/features/database/hooks/use-database-collab-provider'
import { useDatabaseCollabSync } from '@/features/database/hooks/use-database-collab-sync'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { useRows } from '@/features/database/hooks/use-rows'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { useSpaceMembers } from '@/features/workspace/hooks/use-space-members'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import { DatabaseTitle } from '@/features/database/components/database-title'
import { ProjectKanbanView } from '@/features/projects/components/project-kanban-view'
import { ProjectTaskPanel } from '@/features/projects/components/project-task-panel'
import { writeLastProjectBoardId } from '@/features/workspace/lib/workspace-mode'

type ProjectBoardShellProps = {
  spaceId: string
  boardId: string
}

export function ProjectBoardShell({ spaceId, boardId }: ProjectBoardShellProps) {
  const queryClient = useQueryClient()
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
  const { data: database, isLoading, error } = useDatabase(spaceId, boardId)
  const { data: members = [] } = useSpaceMembers(spaceId)
  const { provider } = useDatabaseCollabProvider(boardId)
  const updateSchema = useUpdateDatabaseSchema(spaceId, boardId)

  useDatabaseCollabSync({ provider, spaceId, databaseId: boardId, queryClient })
  const { data: tree } = usePageTree(spaceId)
  const { updateIcon, rename } = useDatabaseActions(spaceId, boardId)
  const canEdit = useCanEditSpace(spaceId)
  const boardView = database?.views.find((view) => view.type === 'board') ?? database?.views[0]

  const { data: rowsResult, isLoading: rowsLoading } = useRows(spaceId, boardId, {
    filters: boardView?.config.filters,
    sorts: boardView?.config.sorts,
    limit: 500,
  })

  const rows = rowsResult?.rows ?? []
  const pages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])

  const groupProperty = useMemo(() => {
    if (!database || !boardView?.config.groupByPropertyId) return undefined
    return findProperty(database.schema.properties, boardView.config.groupByPropertyId)
  }, [boardView, database])

  const titleProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'title'),
    [database],
  )

  const labelProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'label'),
    [database],
  )

  const milestoneProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'milestone'),
    [database],
  )

  const priorityProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'priority'),
    [database],
  )

  const estimateProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'estimate'),
    [database],
  )

  const linkedNoteProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'linked_note'),
    [database],
  )

  const selectedTask = useMemo(
    () => (selectedTaskId ? rows.find((row) => row.id === selectedTaskId) : undefined),
    [rows, selectedTaskId],
  )

  useEffect(() => {
    writeLastProjectBoardId(spaceId, boardId)
  }, [boardId, spaceId])

  useEffect(() => {
    if (!database?.schema || !canEdit) return
    if (!projectBoardSchemaNeedsMerge(database.schema)) return
    void updateSchema.mutateAsync(mergeProjectBoardSchema(database.schema))
  }, [canEdit, database?.schema, updateSchema])

  useEffect(() => {
    if (selectedTaskId && !rowsLoading && !selectedTask) {
      setSelectedTaskId(undefined)
    }
  }, [rowsLoading, selectedTask, selectedTaskId])

  if (isLoading) {
    return <p className="text-sm text-text-primary/55">Loading board…</p>
  }

  if (error || !database || !boardView) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-text-emphasis">Board not found</p>
        <Link
          to="/s/$spaceId/projects"
          params={{ spaceId }}
          className="mt-3 inline-block text-sm text-text-primary/60 hover:text-text-emphasis"
        >
          Back to boards
        </Link>
      </div>
    )
  }

  if (!groupProperty || groupProperty.type !== 'select' || !titleProperty) {
    return (
      <div className="rounded-lg border border-border/60 bg-white/[0.02] px-4 py-8 text-center">
        <p className="text-sm text-text-emphasis">This board needs a Status column</p>
      </div>
    )
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
            onClose={() => setSelectedTaskId(undefined)}
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
                onSelect={(icon) => void updateIcon.mutateAsync(icon)}
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
                  if (title !== database.title) {
                    void rename.mutateAsync(title)
                  }
                }}
              />
              <p className="mt-1 px-1 text-xs tracking-dashboard text-text-primary/45">
                Track work by status · click a task for details, labels, dates, and AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/s/$spaceId/projects/$boardId/settings/labels"
              params={{ spaceId, boardId }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs tracking-dashboard text-text-primary/55 transition-colors hover:bg-white/[0.04] hover:text-text-emphasis"
            >
              <Settings className="size-3.5" strokeWidth={1.75} />
              Board settings
            </Link>
          </div>
        </div>

        {rowsLoading ? (
          <p className="text-sm text-text-primary/45">Loading tasks…</p>
        ) : (
          <div className="min-h-0 flex-1">
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
            onOpenTask={setSelectedTaskId}
          />
          </div>
        )}
      </div>
    </SlidePanelLayout>
  )
}
