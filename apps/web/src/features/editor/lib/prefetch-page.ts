import type { QueryClient } from '@tanstack/react-query'
import { warmCollabConfig } from '@/lib/collab-config-cache'
import { prefetchPageBootstrap } from '@/features/editor/hooks/use-page-bootstrap'
import { fetchPage } from '@/features/editor/hooks/use-page'
import { prefetchBacklinks } from '@/features/links/hooks/use-backlinks'

export function prefetchPage(queryClient: QueryClient, spaceId: string, pageId: string) {
  warmCollabConfig()
  void queryClient.prefetchQuery({
    queryKey: ['page', spaceId, pageId],
    queryFn: () => fetchPage(spaceId, pageId),
    staleTime: 60_000,
  })
  void prefetchPageBootstrap(queryClient, spaceId, pageId)
  void prefetchBacklinks(queryClient, spaceId, pageId)
}
