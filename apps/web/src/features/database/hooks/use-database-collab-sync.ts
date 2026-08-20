import { useEffect } from 'react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { QueryClient } from '@tanstack/react-query'
import type { DatabaseRow } from '../types'
import {
  appendDatabaseRow,
  databaseRowsRootKey,
  removeDatabaseRow,
  updateDatabaseRowCell,
  updateDatabaseRowProperties,
} from '../lib/rows-query-cache'

type DatabaseRowUpdateMessage = {
  type: 'database-row-update'
  databaseId: string
  rowId: string
  propertyId?: string
  value?: unknown
  properties?: Record<string, unknown>
  action?: 'create' | 'delete'
  row?: DatabaseRow
}

type DatabaseChangedMessage = {
  type: 'database-changed'
  databaseId: string
  change: 'schema' | 'view' | 'rows'
}

function parseStatelessPayload(payload: string) {
  try {
    return JSON.parse(payload) as DatabaseRowUpdateMessage | DatabaseChangedMessage
  } catch {
    return null
  }
}

export function useDatabaseCollabSync({
  provider,
  spaceId,
  databaseId,
  queryClient,
}: {
  provider: HocuspocusProvider | null
  spaceId: string
  databaseId: string
  queryClient: QueryClient
}) {
  useEffect(() => {
    if (!provider) return

    const rowsKey = databaseRowsRootKey(spaceId, databaseId)
    const databaseKey = ['database', spaceId, databaseId]

    const handler = ({ payload }: { payload: string }) => {
      const message = parseStatelessPayload(payload)
      if (!message || message.databaseId !== databaseId) return

      if (message.type === 'database-changed') {
        void queryClient.invalidateQueries({ queryKey: databaseKey })
        if (message.change === 'schema') {
          void queryClient.invalidateQueries({ queryKey: rowsKey })
        }
        return
      }

      if (message.type !== 'database-row-update') return

      if (message.action === 'delete') {
        removeDatabaseRow(queryClient, spaceId, databaseId, message.rowId)
        return
      }

      if (message.action === 'create' && message.row) {
        appendDatabaseRow(queryClient, spaceId, databaseId, message.row)
        return
      }

      if (message.properties) {
        updateDatabaseRowProperties(
          queryClient,
          spaceId,
          databaseId,
          message.rowId,
          message.properties,
        )
        return
      }

      if (message.propertyId) {
        updateDatabaseRowCell(
          queryClient,
          spaceId,
          databaseId,
          message.rowId,
          message.propertyId,
          message.value,
        )
      }
    }

    provider.on('stateless', handler)
    return () => {
      provider.off('stateless', handler)
    }
  }, [databaseId, provider, queryClient, spaceId])
}

export function useEmbeddedDatabaseCollabSync({
  provider,
  spaceId,
  databaseId,
  queryClient,
}: {
  provider: HocuspocusProvider | null
  spaceId: string
  databaseId: string
  queryClient: QueryClient
}) {
  useEffect(() => {
    if (!provider || !databaseId) return

    const rowsKey = databaseRowsRootKey(spaceId, databaseId)
    const databaseKey = ['database', spaceId, databaseId]

    const handler = ({ payload }: { payload: string }) => {
      const message = parseStatelessPayload(payload)
      if (!message || message.databaseId !== databaseId) return
      void queryClient.invalidateQueries({ queryKey: rowsKey })
      void queryClient.invalidateQueries({ queryKey: databaseKey })
    }

    provider.on('stateless', handler)
    return () => {
      provider.off('stateless', handler)
    }
  }, [databaseId, provider, queryClient, spaceId])
}
