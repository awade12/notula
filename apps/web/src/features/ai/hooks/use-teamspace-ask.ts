import { useCallback, useRef, useState } from 'react'
import { getApiUrl } from '@/lib/api'
import { polishAskAnswer } from '../lib/polish-ask-answer'
import { resolveReferencedCitations } from '../lib/resolve-referenced-citations'
import type { AiWorkspaceCitation } from '../lib/teamspace-ask-page'
import type { TeamspaceAskMessage, TeamspaceAskRequest } from '../types/teamspace-ask'

function parseCitationsHeader(value: string | null): AiWorkspaceCitation[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AiWorkspaceCitation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseSsePart(raw: string) {
  let content = ''
  let citations: AiWorkspaceCitation[] | undefined

  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as {
        notesapp?: { citations?: AiWorkspaceCitation[] }
        choices?: Array<{ delta?: { content?: string } }>
      }

      if (Array.isArray(parsed.notesapp?.citations)) {
        citations = parsed.notesapp.citations
        continue
      }

      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) content += delta
    } catch {
      // Ignore malformed chunks from upstream.
    }
  }

  return { content, citations }
}

export function useTeamspaceAsk() {
  const [messages, setMessages] = useState<TeamspaceAskMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCitations, setLastCitations] = useState<AiWorkspaceCitation[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setMessages([])
    setError(null)
    setLastCitations([])
  }, [stop])

  const sendMessage = useCallback(async (input: TeamspaceAskRequest) => {
    const trimmed = input.prompt.trim()
    if (!trimmed) return

    stop()
    setError(null)
    setIsStreaming(true)

    let priorMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    setMessages((current) => {
      priorMessages = current.map((message) => ({
        role: message.role,
        content: message.content,
      }))
      return [...current, { role: 'user', content: trimmed }]
    })

    const controller = new AbortController()
    abortRef.current = controller

    let assistantText = ''
    let responseCitations: AiWorkspaceCitation[] = []

    setMessages((current) => [...current, { role: 'assistant', content: '' }])

    try {
      const response = await fetch(`${getApiUrl()}/api/ai/teamspace-chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: input.spaceId,
          prompt: trimmed,
          messages: priorMessages,
          model: input.model,
          contextRefs: input.contextRefs,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Could not get an answer')
      }

      if (!response.body) {
        throw new Error('Empty response stream')
      }

      const headerCitations = parseCitationsHeader(response.headers.get('X-Workspace-Citations'))
      if (headerCitations.length > 0) {
        responseCitations = headerCitations
        setLastCitations(headerCitations)
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
          const parsed = parseSsePart(part)
          if (parsed.citations?.length) {
            responseCitations = parsed.citations
            setLastCitations(parsed.citations)
          }
          if (!parsed.content) continue
          assistantText += parsed.content
          const nextText = assistantText
          setMessages((current) => {
            if (current.length === 0) return current
            const next = [...current]
            const last = next[next.length - 1]
            if (last?.role !== 'assistant') return current
            next[next.length - 1] = { role: 'assistant', content: nextText }
            return next
          })
        }
      }

      if (buffer.trim()) {
        const parsed = parseSsePart(buffer)
        if (parsed.citations?.length) {
          responseCitations = parsed.citations
          setLastCitations(parsed.citations)
        }
        if (parsed.content) {
          assistantText += parsed.content
          setMessages((current) => {
            if (current.length === 0) return current
            const next = [...current]
            const last = next[next.length - 1]
            if (last?.role !== 'assistant') return current
            next[next.length - 1] = { role: 'assistant', content: assistantText }
            return next
          })
        }
      }

      if (!assistantText.trim()) {
        throw new Error('No answer returned')
      }

      const polishedContent = polishAskAnswer(assistantText, responseCitations)
      const referencedCitations = resolveReferencedCitations(polishedContent, responseCitations)
      setMessages((current) => {
        if (current.length === 0) return current
        const next = [...current]
        const last = next[next.length - 1]
        if (last?.role !== 'assistant') return current
        next[next.length - 1] = {
          role: 'assistant',
          content: polishedContent,
          citations: referencedCitations,
        }
        return next
      })
    } catch (streamError) {
      if (controller.signal.aborted) return
      const message =
        streamError instanceof Error ? streamError.message : 'Could not get an answer'
      setError(message)
      setMessages((current) => {
        const last = current[current.length - 1]
        if (last?.role === 'assistant' && !last.content.trim()) {
          return current.slice(0, -1)
        }
        return current
      })
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [stop])

  return {
    messages,
    isStreaming,
    error,
    lastCitations,
    sendMessage,
    stop,
    reset,
  }
}
