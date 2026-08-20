import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { buildPageTree, type FlatPage } from '../lib/build-tree'

export function usePageTree(spaceId: string) {
  return useQuery({
    queryKey: ['pages', spaceId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages`)
      if (!response.ok) {
        throw new Error('Failed to load pages')
      }
      const data = (await response.json()) as { pages: FlatPage[] }
      const pages = data.pages.map((page) => ({
        ...page,
        kind: page.kind === 'folder' ? ('folder' as const) : ('note' as const),
      }))
      return buildPageTree(pages)
    },
    staleTime: 120_000,
  })
}
