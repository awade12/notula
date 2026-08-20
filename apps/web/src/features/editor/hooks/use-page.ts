import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { getCachedPageTitle } from '../lib/get-cached-page-title'

export type Page = {
  id: string
  spaceId: string
  parentId: string | null
  kind: 'note' | 'folder'
  title: string
  position: string
  icon: string | null
  plaintext: string
  updatedAt: string
}

export async function fetchPage(spaceId: string, pageId: string) {
  const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}`)
  if (!response.ok) {
    throw new Error('Failed to load page')
  }
  const data = (await response.json()) as { page: Page }
  return data.page
}

export function usePage(spaceId: string, pageId: string) {
  const queryClient = useQueryClient()
  const cachedTitle = getCachedPageTitle(queryClient, spaceId, pageId)

  return useQuery({
    queryKey: ['page', spaceId, pageId],
    queryFn: () => fetchPage(spaceId, pageId),
    staleTime: 60_000,
    placeholderData: cachedTitle
      ? {
          id: pageId,
          spaceId,
          parentId: null,
          kind: 'note',
          title: cachedTitle,
          position: '',
          icon: null,
          plaintext: '',
          updatedAt: '',
        }
      : undefined,
  })
}
