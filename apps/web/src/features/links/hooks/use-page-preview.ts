import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type PagePreview = {
  id: string
  title: string
  icon: string | null
  snippet: string | null
  openCommentCount: number
}

export function usePagePreview(spaceId: string, pageId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['page-preview', spaceId, pageId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}/preview`)
      if (!response.ok) throw new Error('Preview unavailable')
      const data = (await response.json()) as { preview: PagePreview }
      return data.preview
    },
    enabled: enabled && Boolean(pageId),
    staleTime: 60_000,
  })
}
