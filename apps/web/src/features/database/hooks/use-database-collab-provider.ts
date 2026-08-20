import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { getCollabConfig, invalidateCollabConfig } from '@/lib/collab-config-cache'
import type { ConnectionStatus } from '@/features/editor/types'

export function useDatabaseCollabProvider(databaseId: string) {
  const doc = useMemo(() => new Y.Doc(), [databaseId])
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

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
        name: `database:${databaseId}`,
        document: doc,
        token: config.token,
        onSynced() {
          if (active) {
            wasConnected = true
            setStatus('synced')
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
      collabProvider?.destroy()
      setProvider(null)
    }
  }, [databaseId, doc])

  return { provider, status }
}
