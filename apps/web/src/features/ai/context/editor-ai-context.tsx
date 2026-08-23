import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  appendStreamChunkToEditor,
  createStreamingParagraph,
  insertMarkdownAtCursor,
  replacePageWithMarkdown,
  replaceSelectionWithMarkdown,
} from '@/features/editor/lib/insert-streamed-text'
import { insertOrUpdateBlockForSlashMenu } from '@/features/editor/lib/insert-or-update-block-for-slash-menu'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { EditorAiPreviewOverlay } from '../components/editor-ai-preview-overlay'
import { mergeAiFeatureFlags } from '../lib/feature-flags'
import { pageAiApplyLabel } from '../lib/get-page-ai-apply-mode'
import { normalizePageAiMarkdown } from '../lib/normalize-page-ai-markdown'
import { streamAiCompletion } from '../lib/stream-ai-completion'
import { templateDefaultPrompt } from '../lib/prompt-templates'
import type { AiCompletionTemplate } from '../types'
import type { EditorAiPreviewState } from '../types/editor-ai-preview'
import type { PageAiApplyMode } from '../types/page-ai'

type EditorAiContextValue = {
  flags: ReturnType<typeof mergeAiFeatureFlags>
  isRunning: boolean
  preview: EditorAiPreviewState | null
  runTurnInto: (template: AiCompletionTemplate) => Promise<void>
  runRewrite: (template: AiCompletionTemplate) => Promise<void>
  runContinue: () => Promise<void>
  runSlashAi: (template: AiCompletionTemplate) => Promise<void>
  confirmPreview: () => void
  discardPreview: () => void
}

const EditorAiContext = createContext<EditorAiContextValue | null>(null)

type EditorAiProviderProps = {
  editor: NotesEditor
  pageTitle: string
  spaceId: string
  pageId: string
  children: ReactNode
}

export function EditorAiProvider({ editor, pageTitle, spaceId, pageId, children }: EditorAiProviderProps) {
  const { data: settings } = useAiSettings()
  const [isRunning, setIsRunning] = useState(false)
  const [preview, setPreview] = useState<EditorAiPreviewState | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const flags = mergeAiFeatureFlags(settings?.featureFlags)

  const getContext = useCallback(() => {
    const selection = editor.getSelectedText().trim()
    const pageContext = editor.blocksToMarkdownLossy(editor.document).slice(0, 12000)
    return { selection, pageContext }
  }, [editor])

  const applyPreview = useCallback(
    (applyMode: PageAiApplyMode, after: string) => {
      const output = after.trim()
      if (!output) return

      if (applyMode === 'replace-selection') {
        replaceSelectionWithMarkdown(editor, output)
      } else if (applyMode === 'replace-page') {
        replacePageWithMarkdown(editor, output)
      } else {
        insertMarkdownAtCursor(editor, output)
      }
    },
    [editor],
  )

  const showPreview = useCallback(
    (input: {
      before: string
      after: string
      applyMode: PageAiApplyMode
    }) => {
      const after = normalizePageAiMarkdown(input.after)
      if (!after.trim()) return

      setPreview({
        before: input.before,
        after,
        applyMode: input.applyMode,
        applyLabel: pageAiApplyLabel(input.applyMode),
      })
    },
    [],
  )

  const confirmPreview = useCallback(() => {
    if (!preview) return
    applyPreview(preview.applyMode, preview.after)
    setPreview(null)
  }, [applyPreview, preview])

  const discardPreview = useCallback(() => {
    setPreview(null)
  }, [])

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
      setPreview(null)

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
              spaceId,
              pageId,
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
              spaceId,
              pageId,
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
            spaceId,
            pageId,
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
          showPreview({
            before: selection || pageContext,
            after: output,
            applyMode: selection ? 'replace-selection' : 'replace-page',
          })
          return
        }

        showPreview({
          before: selection,
          after: output,
          applyMode: 'insert',
        })
      } catch (error) {
        if (controller.signal.aborted) return
        console.error(error)
      } finally {
        setIsRunning(false)
        abortRef.current = null
      }
    },
    [editor, getContext, pageId, pageTitle, settings, showPreview, spaceId],
  )

  const value = useMemo<EditorAiContextValue>(
    () => ({
      flags,
      isRunning,
      preview,
      runTurnInto: (template) => runCompletion(template, 'insert'),
      runRewrite: (template) => runCompletion(template, 'replace'),
      runContinue: () => runCompletion('continue', 'stream'),
      runSlashAi: (template) =>
        runCompletion(template, template === 'decision' ? 'decision_block' : 'insert'),
      confirmPreview,
      discardPreview,
    }),
    [confirmPreview, discardPreview, flags, isRunning, preview, runCompletion],
  )

  return (
    <EditorAiContext.Provider value={value}>
      {children}
      {preview ? (
        <EditorAiPreviewOverlay
          preview={preview}
          onConfirm={confirmPreview}
          onDiscard={discardPreview}
        />
      ) : null}
    </EditorAiContext.Provider>
  )
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
