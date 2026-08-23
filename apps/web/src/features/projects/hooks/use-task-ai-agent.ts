import { useCallback, useEffect, useRef, useState } from 'react'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { getApiUrl } from '@/lib/api'
import { normalizeTaskAiMarkdown } from '../lib/normalize-task-ai-markdown'
import type { TaskAiAgentResponse, TaskAiMember, TaskAiMessage, TaskAiProperty } from '../lib/task-ai-types'

type SendMessageInput = {
  prompt: string
  spaceId: string
  boardId: string
  taskId: string
  linkedPageId?: string
  taskTitle: string
  taskContext: string
  properties: TaskAiProperty[]
  members?: TaskAiMember[]
  model?: string
}

const STORAGE_PREFIX = 'notesapp:task-ai:'

function loadStoredMessages(storageKey: string): TaskAiMessage[] {
  if (typeof sessionStorage === 'undefined') return []

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as TaskAiMessage[]
  } catch {
    return []
  }
}

function saveStoredMessages(storageKey: string, messages: TaskAiMessage[]) {
  if (typeof sessionStorage === 'undefined') return

  try {
    if (messages.length === 0) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`)
      return
    }
    sessionStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(messages))
  } catch {
    // ignore quota errors
  }
}

function normalizeTaskAgentResponse(data: TaskAiAgentResponse): TaskAiAgentResponse {
  return {
    reply: normalizeTaskAiMarkdown(data.reply),
    actions: data.actions.map((action) => {
      if (
        action.propertyId !== PROJECT_BOARD_PROPERTY_IDS.description ||
        typeof action.value !== 'string'
      ) {
        return action
      }

      return {
        ...action,
        value: normalizeTaskAiMarkdown(action.value),
      }
    }),
    createTasks: data.createTasks?.map((create) => ({
      ...create,
      description: create.description
        ? normalizeTaskAiMarkdown(create.description)
        : create.description,
    })),
  }
}

function readTaskAgentError(data: unknown, fallback: string) {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return fallback
  }

  const error = (data as { error: unknown }).error
  if (typeof error === 'string' && error.trim()) return error
  if (typeof error === 'object' && error !== null && 'issues' in error) {
    return 'Could not send that request. Try again or check Settings → AI.'
  }

  return fallback
}

export function useTaskAiAgent(storageKey: string) {
  const [messages, setMessages] = useState<TaskAiMessage[]>(() => loadStoredMessages(storageKey))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const storageKeyRef = useRef(storageKey)

  useEffect(() => {
    if (storageKeyRef.current === storageKey) return
    storageKeyRef.current = storageKey
    abortRef.current?.abort()
    abortRef.current = null
    setMessages(loadStoredMessages(storageKey))
    setError(null)
    setIsLoading(false)
  }, [storageKey])

  useEffect(() => {
    saveStoredMessages(storageKey, messages)
  }, [messages, storageKey])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setError(null)
    setIsLoading(false)
    saveStoredMessages(storageKey, [])
  }, [storageKey])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }, [])

  const sendMessage = useCallback(async (input: SendMessageInput) => {
    const trimmed = input.prompt.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setError(null)
    setIsLoading(true)

    let priorMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    setMessages((current) => {
      priorMessages = current.map((message) => ({
        role: message.role,
        content: message.content,
      }))
      return [...current, { role: 'user', content: trimmed }]
    })

    try {
      const response = await fetch(`${getApiUrl()}/api/ai/task-agent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          spaceId: input.spaceId,
          boardId: input.boardId,
          taskId: input.taskId,
          linkedPageId: input.linkedPageId,
          taskTitle: input.taskTitle,
          taskContext: input.taskContext,
          properties: input.properties,
          members: input.members,
          messages: priorMessages,
          model: input.model,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as unknown
        throw new Error(readTaskAgentError(data, 'Task assistant failed'))
      }

      const data = normalizeTaskAgentResponse((await response.json()) as TaskAiAgentResponse)

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
          actions: data.actions,
          createTasks: data.createTasks,
          appliedSummaries: [],
          appliedCreateTitles: [],
        },
      ])
    } catch (requestError) {
      if (controller.signal.aborted) return
      const message =
        requestError instanceof Error ? requestError.message : 'Task assistant failed'
      setError(message)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setIsLoading(false)
    }
  }, [])

  const markActionApplied = useCallback((messageIndex: number, summary: string) => {
    setMessages((current) =>
      current.map((message, index) => {
        if (index !== messageIndex || !message.actions) return message
        const appliedSummaries = [...(message.appliedSummaries ?? []), summary]
        return { ...message, appliedSummaries }
      }),
    )
  }, [])

  const markCreateApplied = useCallback((messageIndex: number, title: string) => {
    setMessages((current) =>
      current.map((message, index) => {
        if (index !== messageIndex || !message.createTasks) return message
        const appliedCreateTitles = [...(message.appliedCreateTitles ?? []), title]
        return { ...message, appliedCreateTitles }
      }),
    )
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    reset,
    markActionApplied,
    markCreateApplied,
  }
}
