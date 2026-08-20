import { apiFetch } from '@/lib/api'

export type Backlink = {
  id: string
  title: string
  icon: string | null
}

export async function fetchBacklinks(spaceId: string, pageId: string) {
  const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}/backlinks`)
  if (!response.ok) {
    throw new Error('Failed to load backlinks')
  }
  const data = (await response.json()) as { backlinks: Backlink[] }
  return data.backlinks
}
