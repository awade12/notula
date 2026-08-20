import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { fetchBacklinks, type Backlink } from '../lib/fetch-backlinks'

export type { Backlink }

export function useBacklinks(spaceId: string, pageId: string) {
  return useQuery({
    queryKey: ['backlinks', spaceId, pageId],
    queryFn: () => fetchBacklinks(spaceId, pageId),
    staleTime: 30_000,
  })
}

export function prefetchBacklinks(queryClient: QueryClient, spaceId: string, pageId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['backlinks', spaceId, pageId],
    queryFn: () => fetchBacklinks(spaceId, pageId),
    staleTime: 30_000,
  })
}
