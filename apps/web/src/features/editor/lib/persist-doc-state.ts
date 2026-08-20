import type { QueryClient } from '@tanstack/react-query'
import * as Y from 'yjs'
import { setDocState } from '@/lib/doc-state-cache'
import { type PageBootstrap, uint8ArrayToBase64 } from './page-bootstrap'

export function persistDocState(
  pageId: string,
  spaceId: string,
  doc: Y.Doc,
  queryClient: QueryClient,
) {
  const state = Y.encodeStateAsUpdate(doc)
  if (state.length === 0) return

  setDocState(pageId, state)

  const yjsState = uint8ArrayToBase64(state)
  queryClient.setQueryData<PageBootstrap>(['page-bootstrap', spaceId, pageId], (prev) => ({
    title: prev?.title ?? 'Untitled',
    yjsState,
  }))
}

export function createDebouncedPersistDocState(delayMs: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return (
    pageId: string,
    spaceId: string,
    doc: Y.Doc,
    queryClient: QueryClient,
  ) => {
    const key = `${spaceId}:${pageId}`
    const existing = timers.get(key)
    if (existing) clearTimeout(existing)

    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        persistDocState(pageId, spaceId, doc, queryClient)
      }, delayMs),
    )
  }
}
