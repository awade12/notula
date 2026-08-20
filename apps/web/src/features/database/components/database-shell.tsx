import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { findProperty } from '@notesapp/shared'
import { Breadcrumbs } from '@/features/workspace/components/breadcrumbs'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import { buildBreadcrumbs } from '@/features/workspace/lib/build-breadcrumbs'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { useSpaces } from '@/features/workspace/hooks/use-spaces'
import { useDatabaseActions } from '@/features/database/hooks/use-database-actions'
import { useDatabaseCollabProvider } from '@/features/database/hooks/use-database-collab-provider'
import { useDatabaseCollabSync } from '@/features/database/hooks/use-database-collab-sync'
import { useDatabase } from '@/features/database/hooks/use-database'
import { useRows } from '@/features/database/hooks/use-rows'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { useCreateView, useUpdateView } from '@/features/database/hooks/use-view-actions'
import { createPropertyDefinition } from '@/features/database/lib/create-property'
import type { PropertyDefinition } from '@notesapp/shared'
import { DatabaseTitle } from '@/features/database/components/database-title'
import { DatabaseToolbar } from '@/features/database/components/database-toolbar'
import { BoardView } from '@/features/database/components/views/board/board-view'
import { TableView } from '@/features/database/components/views/table/table-view'
import { TableSkeleton } from '@/features/database/components/views/table/table-skeleton'
import type { DatabaseView } from '@/features/database/types'

type DatabaseShellProps = {
  spaceId: string
  databaseId: string
}

export function DatabaseShell({ spaceId, databaseId }: DatabaseShellProps) {
  const queryClient = useQueryClient()
  const { data: database, isLoading, error } = useDatabase(spaceId, databaseId)
  const { data: tree } = usePageTree(spaceId)
  const { data: spaces } = useSpaces()
  const canEdit = useCanEditSpace(spaceId)
  const { updateIcon, rename } = useDatabaseActions(spaceId, databaseId)
  const updateSchema = useUpdateDatabaseSchema(spaceId, databaseId)
  const createView = useCreateView(spaceId, databaseId)
  const updateView = useUpdateView(spaceId, databaseId)
  const { provider } = useDatabaseCollabProvider(databaseId)

  useDatabaseCollabSync({ provider, spaceId, databaseId, queryClient })

  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [draftProperties, setDraftProperties] = useState(database?.schema.properties)
  const [renameFocusPropertyId, setRenameFocusPropertyId] = useState<string | null>(null)

  useEffect(() => {
    setDraftProperties(database?.schema.properties)
    if (database?.views[0] && !activeViewId) {
      setActiveViewId(database.views[0].id)
    }
  }, [activeViewId, database])

  const flatPages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])
  const spaceName = spaces?.find((space) => space.id === spaceId)?.name ?? 'Teamspace'

  const breadcrumbs = useMemo(() => {
    const crumbs = buildBreadcrumbs(flatPages, database?.parentId ?? null, spaceName)
    if (database) {
      crumbs.push({
        id: database.id,
        title: database.title,
        icon: database.icon,
        kind: undefined,
      })
    }
    return crumbs
  }, [database, flatPages, spaceName])

  const activeView = useMemo<DatabaseView | undefined>(() => {
    if (!database) return undefined
    return database.views.find((view) => view.id === activeViewId) ?? database.views[0]
  }, [activeViewId, database])

  const { data: rowsResult, isLoading: rowsLoading } = useRows(spaceId, databaseId, {
    filters: activeView?.config.filters,
    sorts: activeView?.config.sorts,
    limit: 500,
  })
  const rows = rowsResult?.rows ?? []

  const schemaProperties = draftProperties ?? database?.schema.properties ?? []

  const visibleProperties = useMemo(() => {
    if (!database || !activeView) return []
    return activeView.config.propertyIds
      .map((propertyId) => findProperty(schemaProperties, propertyId))
      .filter((property) => property !== undefined)
  }, [activeView, database, schemaProperties])

  const processedRows = rows

  const titleProperty = useMemo(
    () => database?.schema.properties.find((property) => property.id === 'title'),
    [database],
  )

  const groupProperty = useMemo(() => {
    if (!database || !activeView?.config.groupByPropertyId) return undefined
    return findProperty(database.schema.properties, activeView.config.groupByPropertyId)
  }, [activeView, database])

  const persistSchema = (nextProperties: typeof draftProperties) => {
    if (!database || !nextProperties) return
    setDraftProperties(nextProperties)
    void updateSchema.mutateAsync({ properties: nextProperties })
  }

  const renameProperty = (propertyId: string, name: string) => {
    if (!draftProperties) return
    persistSchema(
      draftProperties.map((property) =>
        property.id === propertyId ? { ...property, name } : property,
      ),
    )
  }

  const addProperty = (type: PropertyDefinition['type']) => {
    if (!draftProperties || !activeView || !database) return

    const next = createPropertyDefinition(type)
    const nextProperties = [...draftProperties, next]
    const nextPropertyIds = [...activeView.config.propertyIds, next.id]

    setDraftProperties(nextProperties)
    setRenameFocusPropertyId(next.id)

    queryClient.setQueryData(['database', spaceId, databaseId], {
      ...database,
      schema: { properties: nextProperties },
      views: database.views.map((view) =>
        view.id === activeView.id
          ? { ...view, config: { ...view.config, propertyIds: nextPropertyIds } }
          : view,
      ),
    })

    void updateSchema.mutateAsync({ properties: nextProperties })
    void updateView.mutateAsync({
      viewId: activeView.id,
      config: { ...activeView.config, propertyIds: nextPropertyIds },
    })
  }

  const persistViewConfig = (patch: Partial<DatabaseView['config']>) => {
    if (!database || !activeView) return
    void updateView.mutateAsync({
      viewId: activeView.id,
      config: {
        ...activeView.config,
        ...patch,
      },
    })
  }

  const togglePropertyVisibility = (propertyId: string) => {
    if (!activeView || propertyId === 'title') return
    const propertyIds = activeView.config.propertyIds
    const next = propertyIds.includes(propertyId)
      ? propertyIds.filter((id) => id !== propertyId)
      : [...propertyIds, propertyId]
    persistViewConfig({ propertyIds: next })
  }

  const showBoardView =
    activeView?.type === 'board' && groupProperty?.type === 'select'

  if (isLoading) {
    return <p className="text-sm text-text-primary/55">Loading…</p>
  }

  if (error || !database || !draftProperties) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-text-emphasis">Database not found</p>
        <Link
          to="/s/$spaceId"
          params={{ spaceId }}
          className="mt-3 inline-block text-sm text-text-primary/60 hover:text-text-emphasis"
        >
          Back to teamspace
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-none px-6 pb-24 pt-1">
      <Breadcrumbs spaceId={spaceId} items={breadcrumbs} />

      <div className="mb-2 mt-2 flex items-start gap-2">
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
        </div>
      </div>

      <DatabaseToolbar
        readOnly={!canEdit}
        views={database.views}
        activeViewId={activeView?.id ?? database.views[0]?.id ?? ''}
        onSelectView={setActiveViewId}
        onCreateBoard={() => void createView.mutateAsync({ type: 'board' })}
        isCreatingBoard={createView.isPending}
        schema={database.schema}
        properties={draftProperties}
        visiblePropertyIds={activeView?.config.propertyIds ?? []}
        onPropertiesChange={persistSchema}
        onTogglePropertyVisibility={togglePropertyVisibility}
        onAddProperty={addProperty}
        isSavingProperties={updateSchema.isPending}
        filters={activeView?.config.filters ?? []}
        sorts={activeView?.config.sorts ?? []}
        onFiltersChange={(filters) => persistViewConfig({ filters })}
        onSortsChange={(sorts) => persistViewConfig({ sorts })}
      />

      {rowsLoading ? (
        <TableSkeleton columns={Math.max(visibleProperties.length, 3)} />
      ) : showBoardView ? (
        <BoardView
          spaceId={spaceId}
          databaseId={databaseId}
          rows={processedRows}
          groupProperty={groupProperty}
          titleProperty={titleProperty}
        />
      ) : activeView?.type === 'board' ? (
        <div className="rounded-lg border border-border/60 bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm text-text-emphasis">Board view needs a Select property</p>
          <p className="mt-1 text-xs text-text-primary/50">
            Add a Select column, then group this board by it in view settings.
          </p>
        </div>
      ) : (
        <TableView
          spaceId={spaceId}
          databaseId={databaseId}
          properties={visibleProperties}
          rows={processedRows}
          pages={flatPages}
          readOnly={!canEdit}
          onAddProperty={canEdit ? addProperty : undefined}
          onRenameProperty={canEdit ? renameProperty : undefined}
          renameFocusPropertyId={renameFocusPropertyId}
          onRenameFocusDone={() => setRenameFocusPropertyId(null)}
        />
      )}
    </div>
  )
}
