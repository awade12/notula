import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { hydrateDoc } from '@/features/editor/lib/hydrate-doc'
import {
  createDebouncedPersistDocState,
  persistDocState,
} from '@/features/editor/lib/persist-doc-state'
import { getCollabConfig, invalidateCollabConfig } from '@/lib/collab-config-cache'
import type { ConnectionStatus } from '../types'

const debouncedPersistDocState = createDebouncedPersistDocState(400)

export function useCollabProvider(
  pageId: string,
  spaceId: string,
  queryClient: QueryClient,
) {
  const doc = useMemo(() => {
    const nextDoc = new Y.Doc()
    hydrateDoc(nextDoc, pageId, spaceId, queryClient)
    return nextDoc
  }, [pageId, queryClient, spaceId])

  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const onDocUpdate = () => {
      debouncedPersistDocState(pageId, spaceId, doc, queryClient)
    }

    doc.on('update', onDocUpdate)

    const onPageHide = () => {
      persistDocState(pageId, spaceId, doc, queryClient)
    }

    window.addEventListener('pagehide', onPageHide)

    return () => {
      doc.off('update', onDocUpdate)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [doc, pageId, queryClient, spaceId])

  useEffect(() => {
    let active = true
    let collabProvider: HocuspocusProvider | null = null
    let wasConnected = false

    async function connect() {
      const config = await getCollabConfig()
      if (!config || !active) {
        setStatus('disconnected')
        return
      }

      collabProvider = new HocuspocusProvider({
        url: config.url,
        name: `page:${pageId}`,
        document: doc,
        token: config.token,
        onSynced() {
          if (active) {
            wasConnected = true
            setStatus('synced')
            persistDocState(pageId, spaceId, doc, queryClient)
          }
        },
        onStatus({ status: providerStatus }) {
          if (!active) return

          if (providerStatus === WebSocketStatus.Connecting) {
            setStatus(wasConnected ? 'reconnecting' : 'connecting')
            return
          }

          if (providerStatus === WebSocketStatus.Connected && !collabProvider?.isSynced) {
            setStatus(wasConnected ? 'reconnecting' : 'connecting')
          }
        },
        onDisconnect() {
          if (active) setStatus('disconnected')
        },
        onAuthenticationFailed: async () => {
          invalidateCollabConfig()
          const refreshed = await getCollabConfig({ force: true })
          if (!active) return

          if (refreshed?.token && collabProvider) {
            collabProvider.setConfiguration({ token: refreshed.token })
            setStatus('reconnecting')
            return
          }

          setStatus('auth_expired')
        },
      })

      if (active) {
        setProvider(collabProvider)
      }
    }

    void connect()

    return () => {
      active = false
      persistDocState(pageId, spaceId, doc, queryClient)
      collabProvider?.destroy()
      setProvider(null)
    }
  }, [doc, pageId, queryClient, spaceId])

  return { doc, provider, status }
}
