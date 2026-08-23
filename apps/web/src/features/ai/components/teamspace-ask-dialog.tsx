import { Link, useNavigate } from '@tanstack/react-router'
import { FilePlus2, Loader2, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AiMarkdownBody } from '@/features/ai/components/ai-markdown-body'
import { TeamspaceAskSources } from '@/features/ai/components/teamspace-ask-sources'
import { AiMissingKeyNotice } from '@/features/ai/components/ai-model-picker'
import { derivePageTitleFromAnswer, stripCitationLinksForPage } from '@/features/ai/lib/teamspace-ask-page'
import { useTeamspaceAsk } from '@/features/ai/hooks/use-teamspace-ask'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { formatHotkeyLabel } from '@/features/settings/lib/hotkeys'
import { usePageActions } from '@/features/workspace/hooks/use-page-actions'
import { cn } from '@/lib/cn'

type TeamspaceAskDialogProps = {
  spaceId: string
  spaceName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EXAMPLE_PROMPTS = [
  'What is in flight this sprint?',
  'Summarize launch blockers across notes and tasks.',
  'Who is working on auth?',
]

export function TeamspaceAskDialog({
  spaceId,
  spaceName,
  open,
  onOpenChange,
}: TeamspaceAskDialogProps) {
  const { data: settings, isLoading } = useAiSettings()
  const { messages, isStreaming, error, sendMessage, stop, reset } = useTeamspaceAsk()
  const { createPage } = usePageActions(spaceId)
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [isInserting, setIsInserting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) {
      setDraft('')
      reset()
      return
    }

    inputRef.current?.focus()
  }, [open, reset])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isStreaming])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (isStreaming) {
          stop()
          return
        }
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isStreaming, onOpenChange, open, stop])

  async function handleSend(text?: string) {
    const trimmed = (text ?? draft).trim()
    if (!trimmed || isStreaming || !settings?.hasApiKey) return

    setDraft('')
    await sendMessage({
      spaceId,
      prompt: trimmed,
      model: settings.defaultModel,
    })
  }

  async function handleInsertAsPage() {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
    const content = lastAssistant?.content.trim()
    if (!content || isInserting || isStreaming) return

    setIsInserting(true)
    try {
      const markdown = stripCitationLinksForPage(content)
      const page = await createPage.mutateAsync({
        title: derivePageTitleFromAnswer(content),
        markdown,
      })
      onOpenChange(false)
      await navigate({
        to: '/s/$spaceId/p/$pageId',
        params: { spaceId, pageId: page.id },
      })
    } finally {
      setIsInserting(false)
    }
  }

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')

  if (!open) return null

  const title = spaceName ? `Ask · ${spaceName}` : 'Ask this teamspace'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          'relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border',
          'bg-surface shadow-xl',
          'max-h-[min(72vh,640px)]',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-dashboard text-text-primary">
              {title}
            </p>
            <p className="text-xs text-text-primary/45">
              Answers from notes and project tasks in this teamspace
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-2 py-1 text-xs text-text-primary/50 hover:bg-sidebar hover:text-text-primary"
          >
            Esc
          </button>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-text-primary/50">Loading…</div>
        ) : !settings?.hasApiKey ? (
          <div className="overflow-y-auto px-4 py-4">
            <AiMissingKeyNotice />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <div className="space-y-4 py-4">
                  <p className="text-sm text-text-primary/55">
                    Ask about plans, owners, blockers, or what is documented — without opening each
                    page.
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={isStreaming}
                        onClick={() => void handleSend(prompt)}
                        className={cn(
                          'block w-full rounded-lg border border-border px-3 py-2 text-left text-xs',
                          'text-text-primary/70 hover:bg-sidebar disabled:opacity-40',
                        )}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={`${index}:${message.role}`}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm leading-relaxed',
                        message.role === 'user'
                          ? 'bg-sidebar text-text-emphasis'
                          : 'text-text-primary',
                      )}
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-text-primary/40">
                        {message.role === 'user' ? 'You' : 'Answer'}
                      </p>
                      {message.role === 'assistant' ? (
                        <>
                          <AiMarkdownBody content={message.content} spaceId={spaceId} />
                          {message.citations?.length ? (
                            <TeamspaceAskSources
                              spaceId={spaceId}
                              citations={message.citations}
                            />
                          ) : null}
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  ))}

                  {isStreaming && messages[messages.length - 1]?.content === '' ? (
                    <div className="flex items-center gap-2 px-1 text-xs text-text-primary/45">
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                      Looking through your teamspace…
                    </div>
                  ) : null}
                </div>
              )}

              {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
            </div>

            <div className="border-t border-border px-4 py-3">
              <textarea
                ref={inputRef}
                value={draft}
                disabled={isStreaming}
                rows={2}
                placeholder="Ask a question…"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
                className={cn(
                  'w-full resize-none rounded-lg border border-border bg-sidebar px-3 py-2',
                  'text-sm tracking-dashboard text-text-emphasis outline-none',
                  'placeholder:text-text-primary/40 focus:border-white/20 disabled:opacity-40',
                )}
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-text-primary/40">
                  Enter to send · Shift+Enter for newline · {formatHotkeyLabel('mod+shift+k')} to
                  reopen
                </p>
                <div className="flex items-center gap-2">
                  {lastAssistantMessage?.content.trim() ? (
                    <button
                      type="button"
                      disabled={isStreaming || isInserting}
                      onClick={() => void handleInsertAsPage()}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border border-border px-2 py-1',
                        'text-xs text-text-primary/70 hover:bg-sidebar disabled:opacity-40',
                      )}
                    >
                      {isInserting ? (
                        <Loader2 size={12} className="animate-spin" aria-hidden />
                      ) : (
                        <FilePlus2 size={12} aria-hidden />
                      )}
                      Insert as page
                    </button>
                  ) : null}
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-text-primary/70 hover:bg-sidebar"
                    >
                      <Square size={12} aria-hidden />
                      Stop
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!draft.trim() || isStreaming}
                    onClick={() => void handleSend()}
                    className={cn(
                      'rounded-md bg-text-primary px-3 py-1 text-xs font-medium text-surface',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && !settings?.hasApiKey ? (
          <div className="border-t border-border px-4 py-3 text-xs text-text-primary/45">
            <Link to="/settings/ai" className="underline hover:text-text-primary">
              Settings → AI
            </Link>{' '}
            to add your OpenRouter key.
          </div>
        ) : null}
      </div>
    </div>
  )
}
