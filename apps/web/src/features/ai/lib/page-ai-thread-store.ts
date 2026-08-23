import type { PageAiMessage, PageAiThread, PageAiThreadStore } from '../types/page-ai'

const STORAGE_PREFIX = 'notesapp:page-ai-threads:'
const LEGACY_PREFIX = 'notesapp:page-ai:'
const MAX_THREADS = 40

function createThreadId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function derivePageAiThreadTitle(messages: PageAiMessage[]) {
  const firstUser = messages.find((message) => message.role === 'user')
  if (!firstUser?.content.trim()) return 'New conversation'

  const text = firstUser.content.trim().replace(/\s+/g, ' ')
  return text.length > 52 ? `${text.slice(0, 52)}…` : text
}

export function createPageAiThread(messages: PageAiMessage[] = []): PageAiThread {
  const now = Date.now()
  const finalized = messages.filter((message) => !message.streaming)

  return {
    id: createThreadId(),
    title: derivePageAiThreadTitle(finalized),
    createdAt: now,
    updatedAt: now,
    messages: finalized,
  }
}

function normalizeThreadStore(raw: unknown): PageAiThreadStore | null {
  if (typeof raw !== 'object' || raw === null) return null

  const store = raw as Partial<PageAiThreadStore>
  if (!store.activeThreadId || !Array.isArray(store.threads)) return null

  const threads = store.threads
    .filter((thread): thread is PageAiThread => {
      return (
        typeof thread === 'object' &&
        thread !== null &&
        typeof thread.id === 'string' &&
        Array.isArray(thread.messages)
      )
    })
    .map((thread) => ({
      ...thread,
      title: thread.title.trim() || derivePageAiThreadTitle(thread.messages),
      messages: thread.messages.filter((message) => !message.streaming),
    }))

  if (threads.length === 0) return null

  const activeThread =
    threads.find((thread) => thread.id === store.activeThreadId) ?? threads[0]

  return {
    activeThreadId: activeThread!.id,
    threads,
  }
}

function loadLegacyThread(pageId: string): PageAiThread | null {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(`${LEGACY_PREFIX}${pageId}`)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const messages = parsed as PageAiMessage[]
    const thread = createPageAiThread(messages.filter((message) => !message.streaming))
    sessionStorage.removeItem(`${LEGACY_PREFIX}${pageId}`)
    return thread
  } catch {
    return null
  }
}

export function loadPageAiThreadStore(pageId: string): PageAiThreadStore {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${pageId}`)
      if (raw) {
        const parsed = normalizeThreadStore(JSON.parse(raw))
        if (parsed) return parsed
      }
    } catch {
      // fall through
    }
  }

  const legacyThread = loadLegacyThread(pageId)
  if (legacyThread) {
    return {
      activeThreadId: legacyThread.id,
      threads: [legacyThread],
    }
  }

  const thread = createPageAiThread()
  return {
    activeThreadId: thread.id,
    threads: [thread],
  }
}

export function savePageAiThreadStore(pageId: string, store: PageAiThreadStore) {
  if (typeof localStorage === 'undefined') return

  try {
    const active = getActivePageAiThread(store)
    if (!active) {
      localStorage.removeItem(`${STORAGE_PREFIX}${pageId}`)
      return
    }

    const threads = [...store.threads]
      .map((thread) => ({
        ...thread,
        messages: thread.messages.filter((message) => !message.streaming),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_THREADS)

    const activeThread =
      threads.find((thread) => thread.id === active.id) ?? threads[0]

    if (!activeThread) {
      localStorage.removeItem(`${STORAGE_PREFIX}${pageId}`)
      return
    }

    localStorage.setItem(
      `${STORAGE_PREFIX}${pageId}`,
      JSON.stringify({
        activeThreadId: activeThread.id,
        threads,
      }),
    )
  } catch {
    // ignore quota errors
  }
}

export function upsertActiveThreadMessages(
  store: PageAiThreadStore,
  messages: PageAiMessage[],
): PageAiThreadStore {
  const active = getActivePageAiThread(store)
  if (!active) return store

  const now = Date.now()
  const titleSource = messages.filter((message) => !message.streaming)

  const threads = store.threads.map((thread) => {
    if (thread.id !== active.id) return thread

    return {
      ...thread,
      updatedAt: now,
      title: derivePageAiThreadTitle(titleSource),
      messages,
    }
  })

  return {
    activeThreadId: active.id,
    threads,
  }
}

export function addPageAiThread(store: PageAiThreadStore): PageAiThreadStore {
  const thread = createPageAiThread()
  return {
    activeThreadId: thread.id,
    threads: [thread, ...store.threads].slice(0, MAX_THREADS),
  }
}

export function selectPageAiThread(store: PageAiThreadStore, threadId: string): PageAiThreadStore {
  if (!store.threads.some((thread) => thread.id === threadId)) return store
  return { ...store, activeThreadId: threadId }
}

export function deletePageAiThread(store: PageAiThreadStore, threadId: string): PageAiThreadStore {
  const remaining = store.threads.filter((thread) => thread.id !== threadId)
  if (remaining.length === 0) {
    const thread = createPageAiThread()
    return { activeThreadId: thread.id, threads: [thread] }
  }

  const activeThreadId =
    store.activeThreadId === threadId ? remaining[0]!.id : store.activeThreadId

  return { activeThreadId, threads: remaining }
}

export function getActivePageAiThread(store: PageAiThreadStore) {
  return store.threads.find((thread) => thread.id === store.activeThreadId) ?? store.threads[0]
}
