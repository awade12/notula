import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'

export type SearchResult = {
  id: string
  title: string
  icon: string | null
  snippet: string
  matchType: 'title' | 'keyword' | 'semantic'
  updatedAt: string
}

export function useSearch(spaceId: string, query: string) {
  const { searchDebounceMs, searchMaxResults, searchMode, searchScope } = useUserPreferences()
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), searchDebounceMs)
    return () => window.clearTimeout(handle)
  }, [query, searchDebounceMs])

  return useQuery({
    queryKey: ['search', spaceId, debouncedQuery, searchMode, searchMaxResults, searchScope],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        mode: searchMode,
        limit: String(searchMaxResults),
        scope: searchScope,
      })
      const response = await apiFetch(`/api/spaces/${spaceId}/search?${params}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = (await response.json()) as { results: SearchResult[] }
      return data.results
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  })
}

export function filterSearchResultsByScope(
  results: SearchResult[],
  scope: 'all' | 'notes' | 'folders',
  pageKinds: Map<string, string>,
) {
  if (scope === 'all') return results

  return results.filter((result) => {
    const kind = pageKinds.get(result.id) ?? 'note'
    if (scope === 'notes') return kind === 'note'
    return kind === 'folder'
  })
}
