import { ArrowUp, Square } from 'lucide-react'
import { PROJECT_TASK_AI_ACTIONS } from '@/features/projects/lib/build-task-context'
import { useAutoResizeTextarea } from '@/features/projects/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/cn'

type ProjectTaskAiComposerProps = {
  draft: string
  isThinking: boolean
  readOnly: boolean
  showSuggestions: boolean
  variant: 'panel' | 'sidebar'
  onDraftChange: (value: string) => void
  onSend: () => void
  onQuickAction: (prompt: string) => void
  onStop: () => void
}

export function ProjectTaskAiComposer({
  draft,
  isThinking,
  readOnly,
  showSuggestions,
  variant,
  onDraftChange,
  onSend,
  onQuickAction,
  onStop,
}: ProjectTaskAiComposerProps) {
  const canSend = draft.trim().length > 0 && !isThinking && !readOnly
  const messageField = useAutoResizeTextarea(draft, {
    minHeight: variant === 'sidebar' ? 52 : 72,
    maxHeight: variant === 'sidebar' ? 168 : 220,
  })

  return (
    <div
      className={cn(
        'shrink-0 bg-sidebar',
        variant === 'sidebar' ? 'px-3 pb-3 pt-2.5' : 'px-4 pb-4 pt-3',
      )}
    >
      {showSuggestions ? (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {PROJECT_TASK_AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isThinking || readOnly}
              onClick={() => onQuickAction(action.prompt)}
              className={cn(
                'rounded-full border border-border/50 bg-white/[0.03] px-2.5 py-1',
                'text-[11px] text-text-primary/60 transition-colors',
                'hover:border-border hover:bg-white/[0.05] hover:text-text-emphasis disabled:opacity-40',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'relative rounded-[1.15rem] border border-white/[0.08] bg-white/[0.03]',
          'shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]',
          'focus-within:border-white/15 focus-within:bg-white/[0.04]',
        )}
      >
        <textarea
          ref={messageField.ref}
          value={draft}
          disabled={isThinking || readOnly}
          rows={1}
          placeholder={
            readOnly
              ? 'Read-only'
              : isThinking
                ? 'Working on it…'
                : 'Message about this task…'
          }
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (canSend) onSend()
            }
          }}
          className={cn(
            'block w-full resize-none overflow-hidden bg-transparent px-4 py-3 pr-12',
            'text-sm leading-relaxed text-text-emphasis outline-none',
            'placeholder:text-text-primary/35 disabled:opacity-50',
          )}
        />

        {isThinking ? (
          <button
            type="button"
            aria-label="Stop"
            onClick={onStop}
            className="absolute bottom-2.5 right-2.5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-text-primary transition-colors hover:bg-white/[0.1]"
          >
            <Square className="size-3 fill-current" strokeWidth={0} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Send message"
            disabled={!canSend}
            onClick={onSend}
            className={cn(
              'absolute bottom-2.5 right-2.5 flex size-8 items-center justify-center rounded-full transition-colors',
              canSend
                ? 'bg-text-emphasis text-sidebar hover:opacity-90'
                : 'bg-white/[0.06] text-text-primary/25',
            )}
          >
            <ArrowUp className="size-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}
