import { Plus } from 'lucide-react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { BoardGroup } from '@/features/database/lib/group-rows'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { cn } from '@/lib/cn'
import { BoardCard } from './board-card'

type BoardColumnProps = {
  spaceId: string
  group: BoardGroup
  titleProperty: PropertyDefinition | undefined
  linkedNoteProperty?: PropertyDefinition
  pages?: FlatPage[]
  readOnly?: boolean
  focusRowId: string | null
  onUpdateCell: (input: { rowId: string; propertyId: string; value: unknown }) => void
  onCreateRow?: () => void
  isCreating?: boolean
}

export function BoardColumn({
  spaceId,
  group,
  titleProperty,
  linkedNoteProperty,
  pages = [],
  readOnly = false,
  focusRowId,
  onUpdateCell,
  onCreateRow,
  isCreating,
}: BoardColumnProps) {
  return (
    <div className="flex min-h-24 flex-col gap-2 rounded-lg bg-white/[0.02] p-2">
      {group.rows.map((row) => (
        <BoardCard
          key={row.id}
          spaceId={spaceId}
          row={row}
          titleProperty={titleProperty}
          linkedNoteProperty={linkedNoteProperty}
          pages={pages}
          readOnly={readOnly}
          autoFocusTitle={focusRowId === row.id}
          onUpdateCell={onUpdateCell}
        />
      ))}

      {onCreateRow ? (
        <button
          type="button"
          onClick={onCreateRow}
          disabled={isCreating}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-text-primary/40',
            'transition-colors hover:bg-white/[0.04] hover:text-text-primary/65 disabled:opacity-50',
          )}
        >
          <Plus className="size-3.5" strokeWidth={1.75} />
          New
        </button>
      ) : null}
    </div>
  )
}
