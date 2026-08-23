import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPageAiThreadTime } from '../lib/format-page-ai-thread-time'
import type { PageAiThread } from '../types/page-ai'

type PageAiThreadListProps = {
  threads: PageAiThread[]
  activeThreadId: string
  onSelect: (threadId: string) => void
  onDelete: (threadId: string) => void
}

export function PageAiThreadList({
  threads,
  activeThreadId,
  onSelect,
  onDelete,
}: PageAiThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <p className="text-sm text-text-emphasis">No conversations yet</p>
        <p className="max-w-xs text-[13px] leading-relaxed text-text-primary/45">
          Start a new chat to ask about this page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-3">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          isActive={thread.id === activeThreadId}
          onSelect={() => onSelect(thread.id)}
          onDelete={() => onDelete(thread.id)}
        />
      ))}
    </div>
  )
}

function ThreadRow({
  thread,
  isActive,
  onSelect,
  onDelete,
}: {
  thread: PageAiThread
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const messageCount = thread.messages.length
  const preview =
    thread.messages.find((message) => message.role === 'assistant')?.content.trim() ??
    thread.messages.find((message) => message.role === 'user')?.content.trim() ??
    'Empty conversation'

  return (
    <div
      className={cn(
        'group flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors',
        isActive
          ? 'border-border/70 bg-white/[0.06]'
          : 'border-transparent hover:border-border/40 hover:bg-white/[0.03]',
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-medium text-text-emphasis">{thread.title}</p>
          <span className="shrink-0 text-[11px] text-text-primary/35">
            {formatPageAiThreadTime(thread.updatedAt)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-text-primary/45">
          {preview.replace(/\s+/g, ' ')}
        </p>
        <p className="mt-1.5 text-[11px] text-text-primary/30">
          {messageCount === 0 ? 'No messages' : `${messageCount} message${messageCount === 1 ? '' : 's'}`}
        </p>
      </button>

      <button
        type="button"
        aria-label={`Delete ${thread.title}`}
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
        className="mt-0.5 shrink-0 rounded-md p-1.5 text-text-primary/30 opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-red-300/80 group-hover:opacity-100"
      >
        <Trash2 size={13} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
