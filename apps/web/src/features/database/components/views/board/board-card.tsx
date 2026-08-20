import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { CellRenderer } from '@/features/database/components/cells/cell-renderer'
import { RelationCell } from '@/features/database/components/cells/relation-cell'
import { dbCell } from '@/features/database/lib/database-classes'
import { cn } from '@/lib/cn'

type BoardCardProps = {
  spaceId: string
  row: DatabaseRow
  titleProperty: PropertyDefinition | undefined
  linkedNoteProperty?: PropertyDefinition
  pages?: FlatPage[]
  readOnly?: boolean
  autoFocusTitle?: boolean
  onUpdateCell: (input: { rowId: string; propertyId: string; value: unknown }) => void
}

function resolveLinkedPageId(value: unknown) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export function BoardCard({
  spaceId,
  row,
  titleProperty,
  linkedNoteProperty,
  pages = [],
  readOnly = false,
  autoFocusTitle,
  onUpdateCell,
}: BoardCardProps) {
  const linkedPageId = linkedNoteProperty
    ? resolveLinkedPageId(row.properties[linkedNoteProperty.id])
    : null
  const linkedPage = linkedPageId ? pages.find((page) => page.id === linkedPageId) : undefined

  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2 shadow-sm transition-colors hover:border-white/12 hover:bg-white/[0.03]">
      {titleProperty ? (
        <CellRenderer
          rowId={row.id}
          property={titleProperty}
          value={row.properties[titleProperty.id]}
          autoFocus={autoFocusTitle}
          readOnly={readOnly}
          onCommit={(value) =>
            onUpdateCell({ rowId: row.id, propertyId: titleProperty.id, value })
          }
        />
      ) : (
        <div className={cn(dbCell, 'text-sm text-text-primary/35')}>Untitled</div>
      )}

      {linkedNoteProperty ? (
        <div className="mt-2 border-t border-border/40 pt-2">
          {linkedPage ? (
            <Link
              to="/s/$spaceId/p/$pageId"
              params={{ spaceId, pageId: linkedPage.id }}
              className="inline-flex items-center gap-1 text-xs text-text-primary/55 hover:text-text-emphasis"
            >
              <ExternalLink className="size-3" strokeWidth={1.75} />
              {linkedPage.title || 'Linked note'}
            </Link>
          ) : readOnly ? (
            <span className="text-xs text-text-primary/35">No linked note</span>
          ) : (
            <RelationCell
              rowId={row.id}
              propertyId={linkedNoteProperty.id}
              property={linkedNoteProperty}
              value={row.properties[linkedNoteProperty.id]}
              pages={pages}
              readOnly={readOnly}
              onCommit={(value) =>
                onUpdateCell({ rowId: row.id, propertyId: linkedNoteProperty.id, value })
              }
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
