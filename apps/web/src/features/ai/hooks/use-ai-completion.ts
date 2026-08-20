import { useCallback, useRef, useState } from 'react'
import { apiUrl } from '@/lib/api'
import type { AiCompletionRequest } from '../types'

function parseSseChunk(raw: string) {
  const lines = raw.split('\n')
  let content = ''

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>
      }
      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) content += delta
    } catch {
      // Ignore malformed chunks from upstream.
    }
  }

  return content
}

export function useAiCompletion() {
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setOutput('')
    setError(null)
  }, [stop])

  const complete = useCallback(async (input: AiCompletionRequest) => {
    stop()
    setOutput('')
    setError(null)
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${apiUrl}/api/ai/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Completion failed')
      }

      if (!response.body) {
        throw new Error('Empty completion stream')
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
          const chunk = parseSseChunk(part)
          if (chunk) {
            setOutput((current) => current + chunk)
          }
        }
      }

      if (buffer.trim()) {
        const chunk = parseSseChunk(buffer)
        if (chunk) {
          setOutput((current) => current + chunk)
        }
      }
    } catch (streamError) {
      if (controller.signal.aborted) return
      setError(streamError instanceof Error ? streamError.message : 'Completion failed')
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [stop])

  return {
    output,
    isStreaming,
    error,
    complete,
    stop,
    reset,
  }
}
