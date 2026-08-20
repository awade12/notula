import type { QueryClient } from '@tanstack/react-query'
import type { FilterRule, SortRule } from '@notesapp/shared'
import type { DatabaseRow } from '../types'

export type RowsResponse = {
  rows: DatabaseRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type RowsQueryOptions = {
  filters?: FilterRule[]
  sorts?: SortRule[]
  limit?: number
  offset?: number
}

export function databaseRowsQueryKey(
  spaceId: string,
  databaseId: string,
  options?: RowsQueryOptions,
) {
  const filtersKey = options?.filters ? JSON.stringify(options.filters) : ''
  const sortsKey = options?.sorts ? JSON.stringify(options.sorts) : ''
  return [
    'database-rows',
    spaceId,
    databaseId,
    filtersKey,
    sortsKey,
    options?.limit,
    options?.offset,
  ] as const
}

export function databaseRowsRootKey(spaceId: string, databaseId: string) {
  return ['database-rows', spaceId, databaseId] as const
}

function patchRowsResponse(
  current: RowsResponse | undefined,
  patch: (rows: DatabaseRow[]) => DatabaseRow[] | null,
  totalDelta = 0,
): RowsResponse | undefined {
  if (!current) return current
  const nextRows = patch(current.rows)
  if (nextRows === null) return current
  return {
    ...current,
    rows: nextRows,
    total: Math.max(0, current.total + totalDelta),
  }
}

export function patchAllDatabaseRowsQueries(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  patch: (rows: DatabaseRow[]) => DatabaseRow[] | null,
  totalDelta = 0,
) {
  queryClient.setQueriesData<RowsResponse>(
    { queryKey: databaseRowsRootKey(spaceId, databaseId) },
    (current) => patchRowsResponse(current, patch, totalDelta),
  )
}

export function appendDatabaseRow(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  row: DatabaseRow,
) {
  patchAllDatabaseRowsQueries(
    queryClient,
    spaceId,
    databaseId,
    (rows) => {
      if (rows.some((item) => item.id === row.id)) return rows
      return [...rows, row]
    },
    1,
  )
}

export function removeDatabaseRow(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  rowId: string,
) {
  patchAllDatabaseRowsQueries(
    queryClient,
    spaceId,
    databaseId,
    (rows) => {
      if (!rows.some((item) => item.id === rowId)) return null
      return rows.filter((item) => item.id !== rowId)
    },
    -1,
  )
}

export function updateDatabaseRowProperties(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  rowId: string,
  properties: Record<string, unknown>,
) {
  patchAllDatabaseRowsQueries(queryClient, spaceId, databaseId, (rows) =>
    rows.map((row) => (row.id === rowId ? { ...row, properties } : row)),
  )
}

export function updateDatabaseRowCell(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  rowId: string,
  propertyId: string,
  value: unknown,
) {
  patchAllDatabaseRowsQueries(queryClient, spaceId, databaseId, (rows) =>
    rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            properties: {
              ...row.properties,
              [propertyId]: value,
            },
          }
        : row,
    ),
  )
}

export function moveDatabaseRowInKanban(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  rowId: string,
  input: {
    statusPropertyId?: string
    statusValue?: unknown
    beforeId?: string | null
    afterId?: string | null
  },
) {
  patchAllDatabaseRowsQueries(queryClient, spaceId, databaseId, (rows) => {
    let next = rows

    if (input.statusPropertyId !== undefined) {
      next = next.map((row) =>
        row.id === rowId
          ? {
              ...row,
              properties: {
                ...row.properties,
                [input.statusPropertyId!]: input.statusValue,
              },
            }
          : row,
      )
    }

    if (!input.beforeId && !input.afterId) {
      return next
    }

    const fromIndex = next.findIndex((row) => row.id === rowId)
    if (fromIndex === -1) return null

    const reordered = [...next]
    const [moved] = reordered.splice(fromIndex, 1)
    if (!moved) return null

    let insertIndex = reordered.length
    if (input.beforeId) {
      const beforeIndex = reordered.findIndex((row) => row.id === input.beforeId)
      if (beforeIndex !== -1) insertIndex = beforeIndex
    } else if (input.afterId) {
      const afterIndex = reordered.findIndex((row) => row.id === input.afterId)
      if (afterIndex !== -1) insertIndex = afterIndex + 1
    }

    reordered.splice(insertIndex, 0, moved)
    return reordered
  })
}

export function reorderDatabaseRows(
  queryClient: QueryClient,
  spaceId: string,
  databaseId: string,
  rowId: string,
  input: { beforeId?: string | null; afterId?: string | null },
) {
  moveDatabaseRowInKanban(queryClient, spaceId, databaseId, rowId, input)
}
