import { ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useAutoResizeTextarea } from '../hooks/use-auto-resize-textarea'
import {
  useAddTaskComment,
  useTaskActivity,
  type TaskActivityItem,
} from '../hooks/use-task-activity'

type ProjectTaskActivityTabProps = {
  spaceId: string
  boardId: string
  rowId: string
  readOnly?: boolean
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function readInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

function activityLabel(item: TaskActivityItem) {
  if (item.kind === 'comment') return 'commented'
  if (item.kind === 'status_change') return 'changed status'
  if (item.kind === 'property_change') return 'updated'
  if (item.kind === 'created') return 'created this task'
  return 'updated'
}

export function ProjectTaskActivityTab({
  spaceId,
  boardId,
  rowId,
  readOnly = false,
}: ProjectTaskActivityTabProps) {
  const { data: activity = [], isLoading } = useTaskActivity(spaceId, boardId, rowId)
  const addComment = useAddTaskComment(spaceId, boardId, rowId)
  const [draft, setDraft] = useState('')
  const commentField = useAutoResizeTextarea(draft, { minHeight: 52, maxHeight: 168 })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || readOnly) return
    await addComment.mutateAsync(body)
    setDraft('')
  }

  const canPost = draft.trim().length > 0 && !addComment.isPending && !readOnly

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <ActivityLoadingState />
        ) : activity.length === 0 ? (
          <ActivityEmptyState />
        ) : (
          <div className="flex flex-col">
            {activity.map((item, index) => (
              <ActivityFeedItem
                key={item.id}
                item={item}
                isLast={index === activity.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {!readOnly ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="shrink-0 px-3 pb-3 pt-1">
          <div
            className={cn(
              'relative rounded-[1.15rem] border border-white/[0.08] bg-white/[0.03]',
              'shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]',
              'focus-within:border-white/15 focus-within:bg-white/[0.04]',
            )}
          >
            <textarea
              ref={commentField.ref}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={1}
              placeholder="Add a comment…"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  if (canPost) void handleSubmit(event)
                }
              }}
              className={cn(
                'block w-full resize-none overflow-hidden bg-transparent px-3.5 py-2.5 pr-12',
                'text-[13px] leading-relaxed text-text-emphasis outline-none',
                'placeholder:text-text-primary/35 disabled:opacity-50',
              )}
            />
            <button
              type="submit"
              aria-label="Post comment"
              disabled={!canPost}
              className={cn(
                'absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full transition-colors',
                canPost
                  ? 'bg-text-emphasis text-sidebar hover:opacity-90'
                  : 'bg-white/[0.06] text-text-primary/25',
              )}
            >
              <ArrowUp className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

function ActivityLoadingState() {
  return (
    <div className="space-y-4 px-1 py-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex gap-3">
          <div className="size-6 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <p className="text-[13px] text-text-primary/50">No activity yet</p>
      <p className="mt-1 max-w-[14rem] text-[12px] leading-relaxed text-text-primary/35">
        Comments and property changes will show up here.
      </p>
    </div>
  )
}

function ActivityFeedItem({ item, isLast }: { item: TaskActivityItem; isLast: boolean }) {
  const isComment = item.kind === 'comment'

  return (
    <div className="relative flex gap-3 pb-4">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute bottom-0 left-[11px] top-7 w-px bg-border/35"
        />
      ) : null}

      <div
        className={cn(
          'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
          isComment
            ? 'bg-white/[0.08] text-text-emphasis'
            : 'bg-white/[0.04] text-text-primary/45',
        )}
      >
        {readInitials(item.actorName)}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[12px] leading-snug">
          <span className="font-medium text-text-primary/70">{item.actorName}</span>{' '}
          <span className="text-text-primary/40">{activityLabel(item)}</span>
          <span className="text-text-primary/28"> · {formatWhen(item.createdAt)}</span>
        </p>

        {isComment ? (
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-text-emphasis">
            {item.body}
          </p>
        ) : (
          <p className="mt-0.5 text-[12px] leading-snug text-text-primary/45">{item.body}</p>
        )}
      </div>
    </div>
  )
}
