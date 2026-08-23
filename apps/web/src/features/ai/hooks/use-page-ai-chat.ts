import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiUrl } from '@/lib/api'
import { getPageAiApplyMode } from '../lib/get-page-ai-apply-mode'
import { normalizePageAiMarkdown } from '../lib/normalize-page-ai-markdown'
import {
  loadPageAiThreadsFromServer,
  syncPageAiThreadsToServer,
} from '../lib/page-ai-thread-sync'
import {
  addPageAiThread,
  deletePageAiThread,
  getActivePageAiThread,
  loadPageAiThreadStore,
  savePageAiThreadStore,
  selectPageAiThread,
  upsertActiveThreadMessages,
} from '../lib/page-ai-thread-store'
import { normalizeTaskAiMarkdown } from '@/features/projects/lib/normalize-task-ai-markdown'
import { parseAiSsePart, parseCitationsHeader } from '../lib/parse-ai-sse-part'
import { resolveReferencedCitations } from '../lib/resolve-referenced-citations'
import type { AiCompletionTemplate } from '../types'
import type { PageAiMessage, PageAiThread, PageAiThreadStore } from '../types/page-ai'

import type { PageAiContextRef } from '../types/page-ai'

type SendMessageInput = {
  prompt: string
  spaceId: string
  pageId: string
  pageTitle: string
  pageContext?: string
  selection?: string
  template?: AiCompletionTemplate
  model?: string
  contextRefs?: PageAiContextRef[]
}

export function usePageAiChat(pageId: string, spaceId?: string) {
  const [threadStore, setThreadStore] = useState<PageAiThreadStore>(() =>
    loadPageAiThreadStore(pageId),
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pageIdRef = useRef(pageId)
  const syncTimerRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)

  const activeThread = getActivePageAiThread(threadStore)
  const messages = activeThread?.messages ?? []
  const threads = [...threadStore.threads].sort((a, b) => b.updatedAt - a.updatedAt)

  useEffect(() => {
    if (pageIdRef.current === pageId) return
    pageIdRef.current = pageId
    abortRef.current?.abort()
    abortRef.current = null
    hydratedRef.current = false
    setThreadStore(loadPageAiThreadStore(pageId))
    setError(null)
    setIsStreaming(false)
  }, [pageId])

  useEffect(() => {
    if (!spaceId || hydratedRef.current) return

    hydratedRef.current = true
    void loadPageAiThreadsFromServer(spaceId, pageId).then((remote) => {
      if (!remote) return
      setThreadStore((local) => {
        const localUpdated = Math.max(...local.threads.map((thread) => thread.updatedAt), 0)
        const remoteUpdated = Math.max(...remote.threads.map((thread) => thread.updatedAt), 0)
        return remoteUpdated >= localUpdated ? remote : local
      })
    })
  }, [pageId, spaceId])

  useEffect(() => {
    savePageAiThreadStore(pageId, threadStore)

    if (!spaceId || isStreaming) return

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = window.setTimeout(() => {
      void syncPageAiThreadsToServer(spaceId, pageId, threadStore).catch(() => {
        // Offline or auth — local store remains source of truth.
      })
    }, 1200)

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }
    }
  }, [threadStore, pageId, spaceId, isStreaming])

  const updateActiveMessages = useCallback((updater: (current: PageAiMessage[]) => PageAiMessage[]) => {
    setThreadStore((store) => {
      const active = getActivePageAiThread(store)
      if (!active) return store
      return upsertActiveThreadMessages(store, updater(active.messages))
    })
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const startNewThread = useCallback(() => {
    stop()
    setError(null)
    setThreadStore((store) => addPageAiThread(store))
  }, [stop])

  const selectThread = useCallback(
    (threadId: string) => {
      stop()
      setError(null)
      setThreadStore((store) => selectPageAiThread(store, threadId))
    },
    [stop],
  )

  const deleteThread = useCallback(
    (threadId: string) => {
      stop()
      setError(null)
      setThreadStore((store) => deletePageAiThread(store, threadId))
    },
    [stop],
  )

  const deleteActiveThread = useCallback(() => {
    if (!activeThread) return
    deleteThread(activeThread.id)
  }, [activeThread, deleteThread])

  const sendMessage = useCallback(
    async (input: SendMessageInput) => {
      const trimmed = input.prompt.trim()
      if (!trimmed || isStreaming) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const applyMode = getPageAiApplyMode({
        template: input.template,
        hasSelection: Boolean(input.selection?.trim()),
        prompt: trimmed,
      })

      const sourceContent =
        applyMode === 'replace-selection'
          ? input.selection?.trim()
          : applyMode === 'replace-page'
            ? input.pageContext?.trim()
            : undefined

      let priorMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

      setError(null)
      setIsStreaming(true)

      updateActiveMessages((current) => {
        priorMessages = current
          .filter((message) => !message.streaming && message.content.trim())
          .map((message) => ({
            role: message.role,
            content: message.content,
          }))
        return [
          ...current,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: '', streaming: true, applyMode, sourceContent },
        ]
      })

      let assistantText = ''
      let responseCitations = parseCitationsHeader(null)

      try {
        const response = await fetch(`${getApiUrl()}/api/ai/complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            spaceId: input.spaceId,
            pageId: input.pageId,
            pageTitle: input.pageTitle,
            pageContext: input.pageContext,
            selection: input.selection,
            template: input.template,
            model: input.model,
            messages: priorMessages,
            contextRefs: input.contextRefs?.map((ref) =>
              ref.type === 'note'
                ? { type: 'note' as const, id: ref.id }
                : { type: 'task' as const, id: ref.id, boardId: ref.boardId },
            ),
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? 'Completion failed')
        }

        if (!response.body) {
          throw new Error('Empty completion stream')
        }

        const headerCitations = parseCitationsHeader(response.headers.get('X-Workspace-Citations'))
        if (headerCitations.length > 0) {
          responseCitations = headerCitations
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            const parsed = parseAiSsePart(part)
            if (parsed.citations?.length) {
              responseCitations = parsed.citations
            }
            if (!parsed.content) continue

            assistantText += parsed.content
            const nextText = normalizeTaskAiMarkdown(assistantText)

            updateActiveMessages((current) => {
              const next = [...current]
              const last = next[next.length - 1]
              if (last?.role === 'assistant' && last.streaming) {
                next[next.length - 1] = { ...last, content: nextText }
              }
              return next
            })
          }
        }

        if (buffer.trim()) {
          const parsed = parseAiSsePart(buffer)
          if (parsed.citations?.length) {
            responseCitations = parsed.citations
          }
          if (parsed.content) {
            assistantText += parsed.content
          }
        }

        const finalContent = normalizePageAiMarkdown(assistantText)
        if (!finalContent.trim()) {
          throw new Error('No response returned')
        }

        const referencedCitations = resolveReferencedCitations(finalContent, responseCitations)

        updateActiveMessages((current) => {
          const next = [...current]
          const last = next[next.length - 1]
          if (last?.role === 'assistant' && last.streaming) {
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: finalContent,
              citations: referencedCitations,
            }
          }
          return next
        })
      } catch (requestError) {
        if (controller.signal.aborted) return
        const message =
          requestError instanceof Error ? requestError.message : 'Completion failed'
        setError(message)
        updateActiveMessages((current) => {
          const last = current[current.length - 1]
          if (last?.role === 'assistant' && last.streaming && !last.content.trim()) {
            return current.slice(0, -1)
          }
          return current.map((entry) =>
            entry.streaming ? { ...entry, streaming: false } : entry,
          )
        })
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
        setIsStreaming(false)
      }
    },
    [isStreaming, updateActiveMessages],
  )

  return {
    messages,
    threads,
    activeThreadId: threadStore.activeThreadId,
    isStreaming,
    error,
    sendMessage,
    stop,
    startNewThread,
    selectThread,
    deleteThread,
    deleteActiveThread,
  }
}

export type PageAiChatThread = PageAiThread
