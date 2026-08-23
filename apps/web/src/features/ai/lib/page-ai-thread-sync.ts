import { apiFetch } from '@/lib/api'
import type { PageAiThreadStore } from '../types/page-ai'

export async function loadPageAiThreadsFromServer(
  spaceId: string,
  pageId: string,
): Promise<PageAiThreadStore | null> {
  const response = await apiFetch(
    `/api/ai/threads?spaceId=${encodeURIComponent(spaceId)}&scopeType=page&scopeId=${encodeURIComponent(pageId)}`,
  )

  if (!response.ok) return null

  const data = (await response.json()) as {
    threads: Array<{
      id: string
      title: string
      messages: PageAiThreadStore['threads'][number]['messages']
      createdAt: string
      updatedAt: string
    }>
  }

  if (!data.threads.length) return null

  const threads = data.threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    messages: thread.messages,
    createdAt: new Date(thread.createdAt).getTime(),
    updatedAt: new Date(thread.updatedAt).getTime(),
  }))

  return {
    activeThreadId: threads[0]!.id,
    threads,
  }
}

export async function syncPageAiThreadsToServer(
  spaceId: string,
  pageId: string,
  store: PageAiThreadStore,
) {
  const threads = store.threads
    .map((thread) => ({
      id: thread.id,
      title: thread.title,
      messages: thread.messages
        .filter((message) => !message.streaming)
        .map((message) => ({
          role: message.role,
          content: message.content,
          citations: message.citations,
        })),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    }))
    .slice(0, 40)

  await apiFetch('/api/ai/threads/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spaceId,
      scopeType: 'page',
      scopeId: pageId,
      activeThreadId: store.activeThreadId,
      threads,
    }),
  })
}
