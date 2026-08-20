import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { databaseRowsRootKey, type RowsResponse } from '../lib/rows-query-cache'
import type { DatabaseRow } from '../types'

function findRowInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  spaceId: string,
  databaseId: string,
  rowId: string,
  fallback: DatabaseRow,
) {
  const entries = queryClient.getQueriesData<RowsResponse>({
    queryKey: databaseRowsRootKey(spaceId, databaseId),
  })

  for (const [, data] of entries) {
    const row = data?.rows.find((item) => item.id === rowId)
    if (row) return row
  }

  return fallback
}

export function useLiveDatabaseRow(
  spaceId: string,
  databaseId: string,
  rowId: string,
  fallback: DatabaseRow,
) {
  const queryClient = useQueryClient()

  return useSyncExternalStore(
    (onStoreChange) =>
      queryClient.getQueryCache().subscribe((event) => {
        const key = event.query.queryKey
        if (key[0] !== 'database-rows' || key[1] !== spaceId || key[2] !== databaseId) return
        onStoreChange()
      }),
    () => findRowInCache(queryClient, spaceId, databaseId, rowId, fallback),
    () => fallback,
  )
}
