import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  appendStreamChunkToEditor,
  createStreamingParagraph,
  insertMarkdownAtCursor,
  replaceSelectionWithMarkdown,
} from '@/features/editor/lib/insert-streamed-text'
import { insertOrUpdateBlockForSlashMenu } from '@/features/editor/lib/insert-or-update-block-for-slash-menu'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { mergeAiFeatureFlags } from '../lib/feature-flags'
import { streamAiCompletion } from '../lib/stream-ai-completion'
import { templateDefaultPrompt } from '../lib/prompt-templates'
import type { AiCompletionTemplate } from '../types'

type EditorAiContextValue = {
  flags: ReturnType<typeof mergeAiFeatureFlags>
  isRunning: boolean
  runTurnInto: (template: AiCompletionTemplate) => Promise<void>
  runRewrite: (template: AiCompletionTemplate) => Promise<void>
  runContinue: () => Promise<void>
  runSlashAi: (template: AiCompletionTemplate) => Promise<void>
}

const EditorAiContext = createContext<EditorAiContextValue | null>(null)

type EditorAiProviderProps = {
  editor: NotesEditor
  pageTitle: string
  children: ReactNode
}

export function EditorAiProvider({ editor, pageTitle, children }: EditorAiProviderProps) {
  const { data: settings } = useAiSettings()
  const [isRunning, setIsRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const flags = mergeAiFeatureFlags(settings?.featureFlags)

  const getContext = useCallback(() => {
    const selection = editor.getSelectedText().trim()
    const pageContext = editor.blocksToMarkdownLossy(editor.document).slice(0, 12000)
    return { selection, pageContext }
  }, [editor])

  const runCompletion = useCallback(
    async (
      template: AiCompletionTemplate,
      mode: 'insert' | 'replace' | 'stream' | 'decision_block',
    ) => {
      if (!settings?.hasApiKey) {
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsRunning(true)

      const { selection, pageContext } = getContext()
      const prompt = templateDefaultPrompt(template)

      try {
        if (mode === 'decision_block') {
          const block = insertOrUpdateBlockForSlashMenu(editor, {
            type: 'knowledge',
            props: { kind: 'decision', status: 'draft' },
            content: '',
          })

          await streamAiCompletion(
            {
              prompt,
              pageTitle,
              pageContext: selection ? undefined : pageContext,
              selection: selection || undefined,
              template,
              model: settings.defaultModel,
            },
            (_chunk, fullText) => {
              editor.updateBlock(block, {
                type: 'knowledge',
                content: fullText.trim(),
              })
            },
            controller.signal,
          )
          return
        }

        if (mode === 'stream') {
          const blockId = createStreamingParagraph(editor)
          await streamAiCompletion(
            {
              prompt,
              pageTitle,
              pageContext,
              template: 'continue',
              model: settings.defaultModel,
            },
            (chunk) => {
              appendStreamChunkToEditor(editor, blockId, chunk)
            },
            controller.signal,
          )
          return
        }

        const output = await streamAiCompletion(
          {
            prompt,
            pageTitle,
            pageContext: selection ? undefined : pageContext,
            selection: selection || undefined,
            template,
            model: settings.defaultModel,
          },
          () => {},
          controller.signal,
        )

        if (mode === 'replace') {
          replaceSelectionWithMarkdown(editor, output)
        } else {
          insertMarkdownAtCursor(editor, output)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error(error)
      } finally {
        setIsRunning(false)
        abortRef.current = null
      }
    },
    [editor, getContext, pageTitle, settings],
  )

  const value = useMemo<EditorAiContextValue>(
    () => ({
      flags,
      isRunning,
      runTurnInto: (template) => runCompletion(template, 'insert'),
      runRewrite: (template) => runCompletion(template, 'replace'),
      runContinue: () => runCompletion('continue', 'stream'),
      runSlashAi: (template) =>
        runCompletion(template, template === 'decision' ? 'decision_block' : 'insert'),
    }),
    [flags, isRunning, runCompletion],
  )

  return <EditorAiContext.Provider value={value}>{children}</EditorAiContext.Provider>
}

export function useEditorAi() {
  const context = useContext(EditorAiContext)
  if (!context) {
    throw new Error('useEditorAi must be used within EditorAiProvider')
  }
  return context
}

export function useEditorAiOptional() {
  return useContext(EditorAiContext)
}
