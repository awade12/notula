import { useEditorChange } from '@blocknote/react'
import { useCallback, useEffect, useRef } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  clearGhostCompletionState,
  getGhostCompletionState,
  getTextPrefixBeforeCursor,
  setGhostCompletionState,
} from '@/features/editor/lib/ghost-completion-store'
import { acceptGhostCompletion } from '@/features/editor/lib/accept-ghost-completion'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { mergeAiFeatureFlags } from '../lib/feature-flags'
import { streamAiCompletion } from '../lib/stream-ai-completion'

export function useGhostCompletion(editor: NotesEditor, pageTitle: string, enabled: boolean) {
  const { data: settings } = useAiSettings()
  const flags = mergeAiFeatureFlags(settings?.featureFlags)
  const active = enabled && flags.inlineGhostCompletion && Boolean(settings?.hasApiKey)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSuggestion = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    clearGhostCompletionState(editor)
  }, [editor])

  const requestSuggestion = useCallback(() => {
    if (!active) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const prefix = getTextPrefixBeforeCursor(editor)
    if (prefix.trim().length < 8) {
      clearSuggestion()
      return
    }

    setGhostCompletionState(editor, { suggestion: '', isLoading: true })

    void streamAiCompletion(
      {
        prompt: prefix,
        pageTitle,
        template: 'ghost',
        maxTokens: 48,
        model: settings?.defaultModel,
      },
      (_chunk, fullText) => {
        setGhostCompletionState(editor, {
          suggestion: fullText.trim(),
          isLoading: false,
        })
      },
      controller.signal,
    )
      .catch(() => {
        if (!controller.signal.aborted) {
          setGhostCompletionState(editor, { suggestion: '', isLoading: false })
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGhostCompletionState(editor, { isLoading: false })
        }
      })
  }, [active, clearSuggestion, editor, pageTitle, settings?.defaultModel])

  useEditorChange(() => {
    if (!active) return

    setGhostCompletionState(editor, { suggestion: '', isLoading: false })
    abortRef.current?.abort()

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      requestSuggestion()
    }, 700)
  }, editor)

  useEffect(() => {
    if (!active) clearSuggestion()
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      clearSuggestion()
    }
  }, [active, clearSuggestion])

  useEffect(() => {
    if (!active) return

    let cleanup: (() => void) | undefined

    const attach = () => {
      const view = editor.prosemirrorView
      if (!view) return false

      const handleKeyDown = (event: KeyboardEvent) => {
        const { suggestion } = getGhostCompletionState(editor)
        if (event.key !== 'Tab' || event.shiftKey || !suggestion.trim()) return

        event.preventDefault()
        event.stopImmediatePropagation()
        acceptGhostCompletion(editor)
      }

      view.dom.addEventListener('keydown', handleKeyDown, true)
      cleanup = () => view.dom.removeEventListener('keydown', handleKeyDown, true)
      return true
    }

    if (attach()) {
      return () => cleanup?.()
    }

    const intervalId = window.setInterval(() => {
      if (attach()) window.clearInterval(intervalId)
    }, 50)

    return () => {
      window.clearInterval(intervalId)
      cleanup?.()
    }
  }, [active, clearSuggestion, editor])
}
