import { useQuery } from '@tanstack/react-query'
import type { DatabaseSchema, DatabaseViewConfig } from '@notesapp/shared'
import { apiFetch } from '@/lib/api'
import type { DatabaseRow } from '@/features/database/types'

export type PublicBoardPayload = {
  database: {
    id: string
    spaceId: string
    title: string
    icon: string | null
    schema: DatabaseSchema
    publicSlug: string | null
    views: Array<{
      id: string
      type: string
      title: string
      config: DatabaseViewConfig
      position: string
    }>
    updatedAt: string
  }
  rows: DatabaseRow[]
  rowsTotal: number
  boardViewId: string | null
}

export function usePublicBoard(slug: string) {
  return useQuery({
    queryKey: ['public-board', slug],
    queryFn: async () => {
      const response = await apiFetch(`/api/public/boards/${encodeURIComponent(slug)}`)
      if (!response.ok) {
        throw new Error('Board not found')
      }
      return (await response.json()) as PublicBoardPayload
    },
    staleTime: 30_000,
  })
}
