import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import {
  appendDatabaseRow,
  databaseRowsRootKey,
  moveDatabaseRowInKanban,
  removeDatabaseRow,
  reorderDatabaseRows,
  updateDatabaseRowCell,
  updateDatabaseRowProperties,
} from '../lib/rows-query-cache'

export function useUpdateCell(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()
  const queryKey = databaseRowsRootKey(spaceId, databaseId)

  return useMutation({
    mutationFn: async ({
      rowId,
      propertyId,
      value,
    }: {
      rowId: string
      propertyId: string
      value: unknown
    }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows/${rowId}/cells`,
        {
          method: 'PATCH',
          body: JSON.stringify({ propertyId, value }),
        },
      )

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to update cell')
      }

      return response.json() as Promise<{
        id: string
        propertyId: string
        value: unknown
        properties: Record<string, unknown>
      }>
    },
    onMutate: async ({ rowId, propertyId, value }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData({ queryKey })

      updateDatabaseRowCell(queryClient, spaceId, databaseId, rowId, propertyId, value)

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return
      for (const [key, data] of context.previous) {
        queryClient.setQueryData(key, data)
      }
    },
    onSuccess: (data) => {
      updateDatabaseRowProperties(queryClient, spaceId, databaseId, data.id, data.properties)
    },
  })
}

export function useCreateRow(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input?: { properties?: Record<string, unknown> }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${databaseId}/rows`, {
        method: 'POST',
        body: JSON.stringify(input ?? {}),
      })
      if (!response.ok) throw new Error('Failed to create row')
      return response.json() as Promise<{ row: import('../types').DatabaseRow }>
    },
    onSuccess: (data) => {
      appendDatabaseRow(queryClient, spaceId, databaseId, data.row)
    },
  })
}

export function useDeleteRow(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rowId: string) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows/${rowId}`,
        { method: 'DELETE' },
      )
      if (!response.ok) throw new Error('Failed to delete row')
      return response.json()
    },
    onSuccess: (_data, rowId) => {
      removeDatabaseRow(queryClient, spaceId, databaseId, rowId)
    },
  })
}

export function useReorderRow(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()
  const queryKey = databaseRowsRootKey(spaceId, databaseId)

  return useMutation({
    mutationFn: async ({
      rowId,
      beforeId,
      afterId,
    }: {
      rowId: string
      beforeId?: string | null
      afterId?: string | null
    }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows/${rowId}/reorder`,
        {
          method: 'PATCH',
          body: JSON.stringify({ beforeId, afterId }),
        },
      )
      if (!response.ok) throw new Error('Failed to reorder row')
      return response.json() as Promise<{ id: string; position: string }>
    },
    onMutate: async ({ rowId, beforeId, afterId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData({ queryKey })
      reorderDatabaseRows(queryClient, spaceId, databaseId, rowId, { beforeId, afterId })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return
      for (const [key, data] of context.previous) {
        queryClient.setQueryData(key, data)
      }
    },
  })
}

export function useMoveKanbanTask(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()
  const queryKey = databaseRowsRootKey(spaceId, databaseId)

  return useMutation({
    mutationFn: async ({
      rowId,
      statusPropertyId,
      statusValue,
      beforeId,
      afterId,
    }: {
      rowId: string
      statusPropertyId?: string
      statusValue?: unknown
      beforeId?: string | null
      afterId?: string | null
    }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows/${rowId}/move`,
        {
          method: 'PATCH',
          body: JSON.stringify({ statusPropertyId, statusValue, beforeId, afterId }),
        },
      )
      if (!response.ok) throw new Error('Failed to move task')
      return response.json() as Promise<{
        id: string
        position: string
        properties: Record<string, unknown>
      }>
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData({ queryKey })
      moveDatabaseRowInKanban(queryClient, spaceId, databaseId, variables.rowId, variables)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return
      for (const [key, data] of context.previous) {
        queryClient.setQueryData(key, data)
      }
    },
  })
}
