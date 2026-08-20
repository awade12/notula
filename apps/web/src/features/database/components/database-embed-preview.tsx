import { Link } from '@tanstack/react-router'
import { Table2 } from 'lucide-react'
import { useMemo } from 'react'
import { findProperty } from '@notesapp/shared'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { useDatabase } from '@/features/database/hooks/use-database'
import { useDatabaseCollabProvider } from '@/features/database/hooks/use-database-collab-provider'
import { useDatabaseCollabSync } from '@/features/database/hooks/use-database-collab-sync'
import { useRows } from '@/features/database/hooks/use-rows'
import { TableView } from '@/features/database/components/views/table/table-view'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'

type DatabaseEmbedPreviewProps = {
  spaceId: string
  databaseId: string
  compact?: boolean
}

export function DatabaseEmbedPreview({
  spaceId,
  databaseId,
  compact = false,
}: DatabaseEmbedPreviewProps) {
  const queryClient = useQueryClient()
  const { data: database, isLoading } = useDatabase(spaceId, databaseId)
  const { data: tree } = usePageTree(spaceId)
  const { provider } = useDatabaseCollabProvider(databaseId)

  useDatabaseCollabSync({ provider, spaceId, databaseId, queryClient })

  const flatPages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])
  const tableView = database?.views.find((view) => view.type === 'table')
  const { data: rowsResult } = useRows(spaceId, databaseId, {
    filters: tableView?.config.filters,
    sorts: tableView?.config.sorts,
    limit: compact ? 5 : 200,
  })
  const rows = rowsResult?.rows ?? []

  const visibleProperties = useMemo(() => {
    if (!database || !tableView) return []
    return tableView.config.propertyIds
      .map((propertyId) => findProperty(database.schema.properties, propertyId))
      .filter((property) => property !== undefined)
      .slice(0, compact ? 3 : undefined)
  }, [compact, database, tableView])

  const visibleRows = compact ? rows.slice(0, 5) : rows

  if (isLoading || !database) {
    return (
      <div className="rounded-xl border border-border bg-white/[0.015] px-4 py-8 text-center text-sm text-text-primary/50">
        Loading database…
      </div>
    )
  }

  return (
    <div className="notes-database-embed overflow-hidden rounded-lg border border-border/70 bg-white/[0.01]" contentEditable={false}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {database.icon ? (
            <span className="text-base leading-none">{database.icon}</span>
          ) : (
            <Table2 className="size-4 text-text-primary/50" strokeWidth={1.75} />
          )}
          <span className="truncate text-sm font-medium text-text-emphasis">{database.title}</span>
        </div>
        <Link
          to="/s/$spaceId/db/$databaseId"
          params={{ spaceId, databaseId }}
          className={cn(
            'shrink-0 rounded-md px-2 py-1 text-[11px] text-text-primary/55',
            'transition-colors hover:bg-white/[0.04] hover:text-text-emphasis',
          )}
        >
          Open
        </Link>
      </div>
      <TableView
        spaceId={spaceId}
        databaseId={databaseId}
        properties={visibleProperties}
        rows={visibleRows}
        pages={flatPages}
        compact
      />
    </div>
  )
}
