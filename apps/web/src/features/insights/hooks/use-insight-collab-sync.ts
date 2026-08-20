import { useEffect } from 'react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { QueryClient } from '@tanstack/react-query'
import type { NotesEditor } from '@/features/editor/lib/block-schema'

type InsightUpdateMessage = {
  type: 'insight-update'
  insightId: string
  changes: { status?: string; dueDate?: string }
}

type InsightsChangedMessage = {
  type: 'insights-changed'
  spaceId: string
  pageId: string
}

function parseStatelessPayload(payload: string) {
  try {
    return JSON.parse(payload) as InsightUpdateMessage | InsightsChangedMessage
  } catch {
    return null
  }
}

export function useInsightCollabSync({
  editor,
  provider,
  queryClient,
}: {
  editor: NotesEditor
  provider: HocuspocusProvider | null
  queryClient: QueryClient
}) {
  useEffect(() => {
    if (!provider) return

    const handler = ({ payload }: { payload: string }) => {
      const message = parseStatelessPayload(payload)
      if (!message) return

      if (message.type === 'insights-changed') {
        void queryClient.invalidateQueries({ queryKey: ['insights'] })
        return
      }

      if (message.type !== 'insight-update') return

      const block = editor.getBlock(message.insightId)
      if (block?.type !== 'knowledge') return

      editor.updateBlock(block, {
        type: 'knowledge',
        props: {
          ...(message.changes.status
            ? {
                status: message.changes.status as typeof block.props.status,
              }
            : {}),
          ...(message.changes.dueDate !== undefined
            ? { dueDate: message.changes.dueDate }
            : {}),
        },
      })
    }

    provider.on('stateless', handler)
    return () => {
      provider.off('stateless', handler)
    }
  }, [editor, provider, queryClient])
}
