import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useLayoutEffect, useState } from 'react'
import type * as Y from 'yjs'
import {
  applyBootstrapToDoc,
  docHasContent,
} from '@/features/editor/lib/hydrate-doc'
import { fetchPageBootstrap, type PageBootstrap } from '../lib/page-bootstrap'

export function usePageBootstrap(doc: Y.Doc, spaceId: string, pageId: string) {
  const queryClient = useQueryClient()
  const [isBootstrapped, setIsBootstrapped] = useState(() => docHasContent(doc))

  useLayoutEffect(() => {
    if (docHasContent(doc)) {
      setIsBootstrapped(true)
      return
    }

    let active = true

    async function bootstrap() {
      const cached = queryClient.getQueryData<PageBootstrap>([
        'page-bootstrap',
        spaceId,
        pageId,
      ])

      if (cached?.yjsState) {
        applyBootstrapToDoc(doc, cached.yjsState)
        if (active) setIsBootstrapped(true)
        return
      }

      const data = await fetchPageBootstrap(spaceId, pageId)
      if (!active) return

      if (data) {
        queryClient.setQueryData(['page-bootstrap', spaceId, pageId], data)
      }

      if (data?.yjsState) {
        applyBootstrapToDoc(doc, data.yjsState)
        setIsBootstrapped(true)
        return
      }

      setIsBootstrapped(false)
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [doc, pageId, queryClient, spaceId])

  return isBootstrapped
}

export function prefetchPageBootstrap(queryClient: QueryClient, spaceId: string, pageId: string) {
  return queryClient.prefetchQuery({
    queryKey: ['page-bootstrap', spaceId, pageId],
    queryFn: async () => {
      const data = await fetchPageBootstrap(spaceId, pageId)
      return data ?? { title: 'Untitled', yjsState: null }
    },
    staleTime: 30_000,
  })
}
