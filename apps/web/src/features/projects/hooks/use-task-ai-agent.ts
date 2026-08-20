import { useCallback, useRef, useState } from 'react'
import { apiUrl } from '@/lib/api'
import type { TaskAiAgentResponse, TaskAiMember, TaskAiMessage, TaskAiProperty } from '../lib/task-ai-types'

type SendMessageInput = {
  prompt: string
  taskTitle: string
  taskContext: string
  properties: TaskAiProperty[]
  members?: TaskAiMember[]
  model?: string
}

export function useTaskAiAgent() {
  const [messages, setMessages] = useState<TaskAiMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

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
      const response = await fetch(`${apiUrl}/api/ai/task-agent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
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
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Task assistant failed')
      }

      const data = (await response.json()) as TaskAiAgentResponse

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
          actions: data.actions,
          appliedSummaries: [],
        },
      ])
    } catch (requestError) {
      if (controller.signal.aborted) return
      const message =
        requestError instanceof Error ? requestError.message : 'Task assistant failed'
      setError(message)
      setMessages((current) => current.slice(0, -1))
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

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    reset,
    markActionApplied,
  }
}
