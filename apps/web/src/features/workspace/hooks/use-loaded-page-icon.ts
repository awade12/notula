import { loadIcon } from '@/features/workspace/lib/page-icon-loader'
import { useQuery } from '@tanstack/react-query'

export function useLoadedPageIcon(iconName: string | undefined) {
  return useQuery({
    queryKey: ['hugeicon', iconName],
    queryFn: () => loadIcon(iconName!),
    enabled: Boolean(iconName) && typeof window !== 'undefined',
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60,
  })
}
