import { Copy, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import { applyPageAiContent } from '@/features/ai/lib/apply-page-ai-content'
import { pageAiApplyLabel } from '@/features/ai/lib/get-page-ai-apply-mode'
import { cn } from '@/lib/cn'
import type { PageAiMessage } from '../types/page-ai'
import { AiMarkdownBody } from './ai-markdown-body'
import { PageAiReplacePreview } from './page-ai-replace-preview'
import { TeamspaceAskSources } from './teamspace-ask-sources'

type PageAiMessagesProps = {
  spaceId: string
  pageTitle: string
  messages: PageAiMessage[]
  isStreaming: boolean
  error: string | null
  editor: NotesEditor
  onClose: () => void
}

export function PageAiMessages({
  spaceId,
  pageTitle,
  messages,
  isStreaming,
  error,
  editor,
  onClose,
}: PageAiMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isStreaming, error])

  const isEmpty = messages.length === 0 && !isStreaming && !error

  return (
    <div ref={scrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-5 py-5">
      {isEmpty ? (
        <EmptyState pageTitle={pageTitle} />
      ) : (
        <div className="flex flex-col gap-5 pb-1">
          {messages.map((message, index) => (
            <MessageTurn
              key={`${message.role}-${index}`}
              spaceId={spaceId}
              message={message}
              editor={editor}
              onClose={onClose}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.content.trim() === '' ? (
            <ThinkingIndicator />
          ) : null}

          {error ? <PageAiErrorNotice error={error} /> : null}
        </div>
      )}
    </div>
  )
}

function EmptyState({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="flex min-h-[12rem] flex-col justify-center gap-4 px-1 py-6">
      <div className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-white/[0.04]">
        <Sparkles size={16} strokeWidth={1.75} className="text-text-primary/55" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-[15px] leading-snug text-text-emphasis">
          Ask about{' '}
          <span className="font-medium">{pageTitle.trim() || 'this page'}</span> with AI
        </p>
        <p className="max-w-sm text-[13px] leading-relaxed text-text-primary/45">
          Follow-up questions work in this thread. Rewrites show a diff before replacing the page,
          and teamspace sources appear when relevant notes or tasks are used.
        </p>
      </div>
      <p className="text-[12px] text-text-primary/35">
        Select text in the editor to focus the request on that selection.
      </p>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-0.5 py-1">
      <div className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-pulse rounded-full bg-text-primary/35"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-[12px] text-text-primary/40">Thinking</span>
    </div>
  )
}

function PageAiErrorNotice({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5">
      <p className="text-[13px] leading-relaxed text-red-300/90">{error}</p>
    </div>
  )
}

function MessageTurn({
  spaceId,
  message,
  editor,
  onClose,
}: {
  spaceId: string
  message: PageAiMessage
  editor: NotesEditor
  onClose: () => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end pl-6">
        <div className="max-w-[94%] rounded-[1.1rem] rounded-br-sm bg-white/[0.07] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-emphasis">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  if (!message.content.trim() && message.streaming) {
    return null
  }

  const applyMode = message.applyMode ?? 'insert'
  const applyLabel = pageAiApplyLabel(applyMode)
  const isReplaceMode = applyMode === 'replace-page' || applyMode === 'replace-selection'

  function handleApply() {
    if (!message.content.trim()) return
    applyPageAiContent(editor, message.content, applyMode)
    onClose()
  }

  const beforeContent = message.sourceContent ?? ''

  return (
    <div className="group space-y-2.5 pr-1">
      <div className="relative">
        <AiMarkdownBody
          content={message.content}
          spaceId={spaceId}
          className="text-[13px] leading-[1.7] text-text-primary/88 [&_p]:text-text-primary/88"
        />
        {!message.streaming ? (
          <button
            type="button"
            aria-label="Copy response"
            onClick={() => void navigator.clipboard.writeText(message.content)}
            className="absolute -right-0.5 top-0 rounded-md p-1 text-text-primary/30 opacity-0 transition-opacity hover:text-text-primary/70 group-hover:opacity-100"
          >
            <Copy size={13} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      {!message.streaming && message.citations?.length ? (
        <TeamspaceAskSources spaceId={spaceId} citations={message.citations} className="mt-0" />
      ) : null}

      {!message.streaming && message.content.trim() ? (
        isReplaceMode ? (
          <PageAiReplacePreview
            before={beforeContent}
            after={message.content}
            applyLabel={applyLabel}
            onConfirm={handleApply}
          />
        ) : (
          <button
            type="button"
            onClick={handleApply}
            className={cn(
              'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              'bg-text-emphasis text-sidebar hover:opacity-90',
            )}
          >
            {applyLabel}
          </button>
        )
      ) : null}
    </div>
  )
}
