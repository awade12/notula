import { Link } from '@tanstack/react-router'
import { Copy, Loader2, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import { insertMarkdownAtCursor } from '@/features/editor/lib/insert-streamed-text'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { cn } from '@/lib/cn'
import { AI_QUICK_ACTIONS, TURN_INTO_ACTIONS } from '../lib/prompt-templates'
import { mergeAiFeatureFlags } from '../lib/feature-flags'
import { useAiCompletion } from '../hooks/use-ai-completion'
import type { AiCompletionTemplate } from '../types'
import { AiMissingKeyNotice, AiModelPicker } from './ai-model-picker'
import { AiPromptInput } from './ai-prompt-input'

type AiPanelProps = {
  editor: NotesEditor
  pageTitle: string
  onClose: () => void
}

export function AiPanel({ editor, pageTitle, onClose }: AiPanelProps) {
  const { data: settings, isLoading } = useAiSettings()
  const { output, isStreaming, error, complete, stop, reset } = useAiCompletion()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<AiCompletionTemplate | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const pageContext = editor.blocksToMarkdownLossy(editor.document).slice(0, 12000)
  const featureFlags = mergeAiFeatureFlags(settings?.featureFlags)

  useEffect(() => {
    const node = outputRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [output, isStreaming])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function runCompletion(template?: AiCompletionTemplate, nextPrompt?: string) {
    const trimmed = (nextPrompt ?? prompt).trim()
    if (!trimmed || isStreaming) return

    const selection = editor.getSelectedText().trim()

    await complete({
      prompt: trimmed,
      pageTitle,
      pageContext: selection ? undefined : pageContext,
      selection: selection || undefined,
      template: template ?? activeTemplate ?? undefined,
      model: model ?? undefined,
    })
  }

  function handleQuickAction(template: AiCompletionTemplate, actionPrompt: string) {
    setActiveTemplate(template)
    setPrompt(actionPrompt)
    void runCompletion(template, actionPrompt)
  }

  function handleInsert() {
    if (!output.trim()) return
    insertMarkdownAtCursor(editor, output)
    onClose()
  }

  async function handleCopy() {
    if (!output.trim()) return
    await navigator.clipboard.writeText(output)
  }

  if (isLoading) {
    return (
      <AiPanelFrame onClose={onClose}>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-text-primary/50">
          Loading…
        </div>
      </AiPanelFrame>
    )
  }

  if (!settings?.hasApiKey) {
    return (
      <AiPanelFrame onClose={onClose}>
        <div className="flex-1 overflow-y-auto p-4">
          <AiMissingKeyNotice />
        </div>
      </AiPanelFrame>
    )
  }

  return (
    <AiPanelFrame onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={outputRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-4">
          {error ? <p className="mb-3 text-xs text-red-400">{error}</p> : null}

          {isStreaming && !output ? (
            <div className="flex items-center gap-2 text-xs text-text-primary/50">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Generating…
            </div>
          ) : null}

          {output ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed tracking-dashboard text-text-emphasis">
              {output}
            </pre>
          ) : !isStreaming ? (
            <p className="text-xs leading-relaxed tracking-dashboard text-text-primary/45">
              Ask about this page, run a quick action below, or select text in the editor to focus
              the request.
            </p>
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border bg-sidebar px-4 py-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-text-primary/45">Model</p>
            <AiModelPicker value={model} onChange={setModel} disabled={isStreaming} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AI_QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={isStreaming}
                onClick={() => handleQuickAction(action.id, action.prompt)}
                className={cn(
                  'rounded-full border border-border px-2.5 py-1 text-[11px] tracking-dashboard',
                  'text-text-primary transition-colors hover:bg-white/[0.05] disabled:opacity-40',
                  activeTemplate === action.id && 'border-white/20 bg-white/[0.06] text-text-emphasis',
                )}
              >
                {action.label}
              </button>
            ))}
          </div>

          {featureFlags.turnInto ? (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-text-primary/45">Turn into</p>
              <div className="flex flex-wrap gap-1.5">
                {TURN_INTO_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => handleQuickAction(action.id, `Turn this into ${action.label.toLowerCase()}.`)}
                    className={cn(
                      'rounded-full border border-border px-2.5 py-1 text-[11px] tracking-dashboard',
                      'text-text-primary transition-colors hover:bg-white/[0.05] disabled:opacity-40',
                      activeTemplate === action.id && 'border-white/20 bg-white/[0.06] text-text-emphasis',
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AiPromptInput
            value={prompt}
            onChange={setPrompt}
            disabled={isStreaming}
            onSubmit={() => void runCompletion()}
          />

          <div className="flex flex-wrap gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
                  'text-xs tracking-dashboard text-text-primary hover:bg-white/[0.05]',
                )}
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                disabled={!prompt.trim()}
                onClick={() => void runCompletion()}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2',
                  'text-xs tracking-dashboard text-text-emphasis hover:bg-white/14 disabled:opacity-40',
                )}
              >
                <Sparkles size={13} strokeWidth={1.75} aria-hidden />
                Generate
              </button>
            )}

            {output ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
                    'text-xs tracking-dashboard text-text-primary hover:bg-white/[0.05]',
                  )}
                >
                  <Copy size={13} strokeWidth={1.75} aria-hidden />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleInsert}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
                    'text-xs tracking-dashboard text-text-emphasis hover:bg-white/[0.05]',
                  )}
                >
                  Insert into page
                </button>
              </>
            ) : null}

            {output || error ? (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-3 py-2 text-xs tracking-dashboard text-text-primary/60 hover:text-text-primary"
              >
                Clear
              </button>
            ) : null}
          </div>

          <p className="text-[10px] leading-relaxed text-text-primary/40">
            Uses your OpenRouter key from{' '}
            <Link to="/settings/ai" className="underline-offset-2 hover:underline">
              Settings → AI
            </Link>
            . Page content is sent when generating.
          </p>
        </div>
      </div>
    </AiPanelFrame>
  )
}

function AiPanelFrame({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  return (
    <aside className="notes-ai-panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border py-3 pl-4 pr-14">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.75} className="text-text-primary/60" aria-hidden />
          <h2 className="text-sm font-medium tracking-dashboard text-text-emphasis">AI</h2>
        </div>
        <button
          type="button"
          aria-label="Close AI panel"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-primary/50 transition-colors hover:bg-white/[0.05] hover:text-text-primary"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  )
}
