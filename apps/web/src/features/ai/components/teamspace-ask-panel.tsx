import { FilePlus2, Loader2, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AiMarkdownBody } from '@/features/ai/components/ai-markdown-body'
import { PageAiContextPicker } from '@/features/ai/components/page-ai-context-picker'
import { TeamspaceAskSources } from '@/features/ai/components/teamspace-ask-sources'
import { AiMissingKeyNotice } from '@/features/ai/components/ai-model-picker'
import { derivePageTitleFromAnswer, stripCitationLinksForPage } from '@/features/ai/lib/teamspace-ask-page'
import { useTeamspaceAsk } from '@/features/ai/hooks/use-teamspace-ask'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { usePageActions } from '@/features/workspace/hooks/use-page-actions'
import type { PageAiContextRef } from '@/features/ai/types/page-ai'
import { cn } from '@/lib/cn'

type TeamspaceAskPanelProps = {
  spaceId: string
  spaceName?: string
  compact?: boolean
  onClose?: () => void
}

const EXAMPLE_PROMPTS = [
  'What is in flight this sprint?',
  'Summarize launch blockers across notes and tasks.',
  'Who is working on auth?',
]

export function TeamspaceAskPanel({
  spaceId,
  spaceName,
  compact = false,
  onClose,
}: TeamspaceAskPanelProps) {
  const { data: settings, isLoading } = useAiSettings()
  const { messages, isStreaming, error, sendMessage, stop, reset } = useTeamspaceAsk()
  const { createPage } = usePageActions(spaceId)
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [contextRefs, setContextRefs] = useState<PageAiContextRef[]>([])
  const [isInserting, setIsInserting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => reset()
  }, [reset, spaceId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isStreaming])

  async function handleSend(text?: string) {
    const trimmed = (text ?? draft).trim()
    if (!trimmed || isStreaming || !settings?.hasApiKey) return

    setDraft('')
    await sendMessage({
      spaceId,
      prompt: trimmed,
      model: settings.defaultModel,
      contextRefs: contextRefs.map((ref) =>
        ref.type === 'note'
          ? { type: 'note' as const, id: ref.id }
          : { type: 'task' as const, id: ref.id, boardId: ref.boardId },
      ),
    })
  }

  async function handleSaveAsPage(messageContent: string) {
    if (isInserting) return
    setIsInserting(true)

    try {
      const title = derivePageTitleFromAnswer(messageContent)
      const markdown = stripCitationLinksForPage(messageContent)
      const page = await createPage.mutateAsync({ title, markdown })
      onClose?.()
      await navigate({
        to: '/s/$spaceId/p/$pageId',
        params: { spaceId, pageId: page.id },
      })
    } finally {
      setIsInserting(false)
    }
  }

  if (isLoading) {
    return <p className="px-4 py-6 text-xs text-text-primary/50">Loading…</p>
  }

  if (!settings?.hasApiKey) {
    return (
      <div className="p-4">
        <AiMissingKeyNotice />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!compact ? (
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-text-emphasis">
            Ask {spaceName?.trim() || 'teamspace'}
          </p>
          <p className="mt-0.5 text-xs text-text-primary/45">
            Search notes and tasks, then get an answer with sources.
          </p>
        </div>
      ) : null}

      <div ref={scrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !isStreaming && !error ? (
          <div className="space-y-3 py-2">
            <p className="text-xs text-text-primary/45">Try one of these:</p>
            <ul className="space-y-1">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-text-primary/60 hover:bg-sidebar"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(message.role === 'user' ? 'text-text-emphasis' : 'text-text-primary/80')}
              >
                {message.role === 'assistant' ? (
                  <>
                    <AiMarkdownBody content={message.content} spaceId={spaceId} />
                    {message.citations?.length ? (
                      <TeamspaceAskSources citations={message.citations} spaceId={spaceId} />
                    ) : null}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={isInserting}
                        onClick={() => void handleSaveAsPage(message.content)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-primary/45 hover:bg-sidebar hover:text-text-primary/70"
                      >
                        {isInserting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <FilePlus2 className="size-3" />
                        )}
                        Save as page
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            ))}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 py-2">
        <PageAiContextPicker
          spaceId={spaceId}
          contextRefs={contextRefs}
          disabled={isStreaming}
          onChange={setContextRefs}
        />
        <div className="mt-2 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            rows={2}
            placeholder="Ask about notes, tasks, blockers…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
            className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-border/80"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-border p-2 text-text-primary/60 hover:bg-sidebar"
              aria-label="Stop"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => void handleSend()}
              className="rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
