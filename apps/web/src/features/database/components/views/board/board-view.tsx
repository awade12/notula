import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '@/features/database/types'
import { groupRowsBySelect } from '@/features/database/lib/group-rows'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { useCreateRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { dbNewRow, dbSelectPill } from '@/features/database/lib/database-classes'
import { BoardColumn } from './board-column'
import { cn } from '@/lib/cn'

type BoardViewProps = {
  spaceId: string
  databaseId: string
  rows: DatabaseRow[]
  groupProperty: PropertyDefinition
  titleProperty: PropertyDefinition | undefined
  linkedNoteProperty?: PropertyDefinition
  pages?: import('@/features/workspace/lib/build-tree').FlatPage[]
  readOnly?: boolean
  includeEmptyGroup?: boolean
}

export function BoardView({
  spaceId,
  databaseId,
  rows,
  groupProperty,
  titleProperty,
  linkedNoteProperty,
  pages = [],
  readOnly = false,
  includeEmptyGroup = true,
}: BoardViewProps) {
  const updateCell = useUpdateCell(spaceId, databaseId)
  const createRow = useCreateRow(spaceId, databaseId)
  const [focusRowId, setFocusRowId] = useState<string | null>(null)

  const defaultGroupValue = groupProperty.config?.options?.[0]?.id ?? null

  const groups = useMemo(
    () => groupRowsBySelect(rows, groupProperty, { includeEmptyGroup }),
    [groupProperty, includeEmptyGroup, rows],
  )

  const handleCreateInGroup = async (groupValue: string | null) => {
    const result = await createRow.mutateAsync({})
    if (groupValue && groupProperty) {
      await updateCell.mutateAsync({
        rowId: result.row.id,
        propertyId: groupProperty.id,
        value: groupValue,
      })
    }
    setFocusRowId(result.row.id)
  }

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {groups.map((group) => (
          <div key={group.id ?? 'empty'} className="flex min-w-72 flex-1 flex-col">
            <div className="mb-2 flex items-center gap-2 px-1">
              {group.color ? (
                <span className={cn(dbSelectPill, selectOptionClassName(group.color))}>
                  {group.label}
                </span>
              ) : (
                <span className="text-xs font-medium text-text-primary/55">{group.label}</span>
              )}
              <span className="text-[11px] text-text-primary/35">{group.rows.length}</span>
            </div>
            <BoardColumn
              spaceId={spaceId}
              group={group}
              titleProperty={titleProperty}
              linkedNoteProperty={linkedNoteProperty}
              pages={pages}
              readOnly={readOnly}
              focusRowId={focusRowId}
              onUpdateCell={(input) => void updateCell.mutateAsync(input)}
              onCreateRow={readOnly ? undefined : () => void handleCreateInGroup(group.id)}
              isCreating={createRow.isPending}
            />
          </div>
        ))}
      </div>

      {!readOnly ? (
        <button
          type="button"
          onClick={() =>
            void handleCreateInGroup(includeEmptyGroup ? null : defaultGroupValue)
          }
          disabled={createRow.isPending}
          className={cn(dbNewRow, 'disabled:opacity-50')}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {createRow.isPending ? 'Adding…' : 'New card'}
        </button>
      ) : null}
    </div>
  )
}
