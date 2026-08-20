import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
} from '@tanstack/react-table/legacy'
import { useMemo, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { PropertyDefinition } from '@notesapp/shared'
import { cn } from '@/lib/cn'
import type { DatabaseRow } from '@/features/database/types'
import { useCreateRow, useDeleteRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import { CellRenderer } from '@/features/database/components/cells/cell-renderer'
import {
  dbNewRow,
  dbRowGutter,
  getTableColumnClass,
  resolveTableColumnKind,
} from '@/features/database/lib/database-classes'
import { getAdjacentCell, type NavDirection } from '@/features/database/lib/table-navigation'
import { TableRowGutter } from './table-row-gutter'
import { TableHeaderLabel } from './table-header-label'
import { TableAddColumnHeader } from './table-add-column-header'

type TableViewProps = {
  spaceId: string
  databaseId: string
  properties: PropertyDefinition[]
  rows: DatabaseRow[]
  pages: FlatPage[]
  onAddProperty?: (type: PropertyDefinition['type']) => void
  onRenameProperty?: (propertyId: string, name: string) => void
  renameFocusPropertyId?: string | null
  onRenameFocusDone?: () => void
  compact?: boolean
  readOnly?: boolean
}

const columnHelper = legacyCreateColumnHelper<DatabaseRow>()

function getTitlePropertyId(properties: PropertyDefinition[]) {
  return properties.find((property) => property.id === 'title')?.id ?? properties[0]?.id
}

export function TableView({
  spaceId,
  databaseId,
  properties,
  rows,
  pages,
  onAddProperty,
  onRenameProperty,
  renameFocusPropertyId = null,
  onRenameFocusDone,
  compact = false,
  readOnly = false,
}: TableViewProps) {
  const updateCell = useUpdateCell(spaceId, databaseId)
  const createRow = useCreateRow(spaceId, databaseId)
  const deleteRow = useDeleteRow(spaceId, databaseId)
  const [focusCell, setFocusCell] = useState<{ rowId: string; propertyId: string } | null>(
    null,
  )

  const titlePropertyId = getTitlePropertyId(properties)
  const propertyIds = useMemo(() => properties.map((property) => property.id), [properties])

  const navigateCell = useCallback(
    (direction: NavDirection) => {
      setFocusCell((current) => {
        if (!current) return current
        return getAdjacentCell(rows, propertyIds, current, direction) ?? current
      })
    },
    [propertyIds, rows],
  )

  const columns = useMemo(
    () => [
      ...(compact || readOnly
        ? []
        : [
            columnHelper.display({
              id: '_gutter',
              header: () => <span className={dbRowGutter} />,
              cell: ({ row }) => (
                <TableRowGutter onDelete={() => void deleteRow.mutateAsync(row.original.id)} />
              ),
            }),
          ]),
      ...properties.map((property, index) =>
        columnHelper.accessor((row) => row.properties[property.id], {
          id: property.id,
          header: () => (
            <TableHeaderLabel
              property={property}
              onRename={(propertyId, name) => onRenameProperty?.(propertyId, name)}
              editable={Boolean(onRenameProperty) && !compact}
              autoFocusRename={renameFocusPropertyId === property.id}
              onAutoFocusRenameDone={onRenameFocusDone}
            />
          ),
          cell: ({ row }) => (
            <CellRenderer
              rowId={row.original.id}
              property={property}
              value={row.original.properties[property.id]}
              pages={pages}
              autoFocus={
                focusCell?.rowId === row.original.id &&
                focusCell.propertyId === property.id
              }
              onNavigate={navigateCell}
              readOnly={readOnly}
              onCommit={(value) =>
                void updateCell.mutateAsync({
                  rowId: row.original.id,
                  propertyId: property.id,
                  value,
                })
              }
            />
          ),
          meta: { isTitle: index === 0 || property.id === 'title' },
        }),
      ),
      ...(compact || readOnly
        ? []
        : [
            columnHelper.display({
              id: '_add-column',
              header: () =>
                onAddProperty ? (
                  <TableAddColumnHeader onAddProperty={onAddProperty} />
                ) : (
                  <span className="block w-8" />
                ),
              cell: () => <span className="block w-8" />,
            }),
          ]),
    ],
    [
      compact,
      deleteRow,
      focusCell,
      navigateCell,
      onAddProperty,
      onRenameFocusDone,
      onRenameProperty,
      pages,
      properties,
      readOnly,
      renameFocusPropertyId,
      updateCell,
    ],
  )

  const table = useLegacyTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCreateRow = async () => {
    const result = await createRow.mutateAsync({})
    if (titlePropertyId) {
      setFocusCell({ rowId: result.row.id, propertyId: titlePropertyId })
    }
  }

  const colSpan =
    properties.length + (compact ? 0 : 2)

  return (
    <div className="-mx-6">
      <div className="overflow-x-auto pb-1">
        <table className="w-max min-w-full border-separate border-spacing-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={getTableColumnClass(
                      resolveTableColumnKind(header.column.id),
                      'head',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group/row">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={getTableColumnClass(
                      resolveTableColumnKind(cell.column.id),
                      'body',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {!compact && !readOnly ? (
              <tr>
                <td colSpan={colSpan} className="border-0 p-0">
                  <button
                    type="button"
                    onClick={() => void handleCreateRow()}
                    disabled={createRow.isPending}
                    className={cn(dbNewRow, 'disabled:opacity-50')}
                  >
                    <Plus className="size-4" strokeWidth={1.75} />
                    {createRow.isPending ? 'Adding…' : 'New'}
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!compact && rows.length === 0 ? (
        <p className="px-3 py-6 text-sm text-text-primary/35">
          No rows yet — click New to add your first one.
        </p>
      ) : null}
    </div>
  )
}
