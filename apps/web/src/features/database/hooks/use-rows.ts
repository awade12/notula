import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DatabaseSummary } from '../types'
import {
  databaseRowsQueryKey,
  type RowsQueryOptions,
  type RowsResponse,
} from '../lib/rows-query-cache'

export type { RowsResponse, RowsQueryOptions }

export function useAllDatabases(spaceId: string) {
  return useQuery({
    queryKey: ['databases', spaceId, 'all'],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases`)
      if (!response.ok) {
        throw new Error('Failed to load databases')
      }
      const data = (await response.json()) as { databases: DatabaseSummary[] }
      return data.databases
    },
    staleTime: 30_000,
  })
}

export function useDatabases(spaceId: string, parentId: string | null) {
  return useQuery({
    queryKey: ['databases', spaceId, parentId],
    queryFn: async () => {
      const query = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '?parentId=null'
      const response = await apiFetch(`/api/spaces/${spaceId}/databases${query}`)
      if (!response.ok) {
        throw new Error('Failed to load databases')
      }
      const data = (await response.json()) as { databases: DatabaseSummary[] }
      return data.databases
    },
    staleTime: 30_000,
  })
}

export function useRows(spaceId: string, databaseId: string, options?: RowsQueryOptions) {
  return useQuery({
    queryKey: databaseRowsQueryKey(spaceId, databaseId, options),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.filters?.length) {
        params.set('filters', JSON.stringify(options.filters))
      }
      if (options?.sorts?.length) {
        params.set('sorts', JSON.stringify(options.sorts))
      }
      if (options?.limit !== undefined) {
        params.set('limit', String(options.limit))
      }
      if (options?.offset !== undefined) {
        params.set('offset', String(options.offset))
      }

      const query = params.toString()
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows${query ? `?${query}` : ''}`,
      )
      if (!response.ok) {
        throw new Error('Failed to load rows')
      }
      const data = (await response.json()) as RowsResponse
      return data
    },
    staleTime: 10_000,
  })
}

export function useLoadMoreRows(spaceId: string, databaseId: string, options?: RowsQueryOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nextOffset: number) => {
      const params = new URLSearchParams()
      if (options?.filters?.length) {
        params.set('filters', JSON.stringify(options.filters))
      }
      if (options?.sorts?.length) {
        params.set('sorts', JSON.stringify(options.sorts))
      }
      params.set('limit', String(options?.limit ?? 200))
      params.set('offset', String(nextOffset))

      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/rows?${params.toString()}`,
      )
      if (!response.ok) {
        throw new Error('Failed to load rows')
      }
      return (await response.json()) as RowsResponse
    },
    onSuccess: (data, nextOffset) => {
      const key = databaseRowsQueryKey(spaceId, databaseId, options)

      queryClient.setQueryData<RowsResponse>(key, (current) => {
        if (!current || nextOffset === 0) return data
        return {
          ...data,
          rows: [...current.rows, ...data.rows],
          offset: current.offset,
        }
      })
    },
  })
}
