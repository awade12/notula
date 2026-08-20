import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { AiMissingKeyNotice } from '@/features/ai/components/ai-model-picker'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { useUpdateCell } from '@/features/database/hooks/use-update-cell'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { useTaskAiAgent } from '../hooks/use-task-ai-agent'
import { applyTaskAiAction, applyTaskAiActions } from '../lib/apply-task-ai-action'
import { buildTaskAiPropertySchema } from '../lib/build-task-ai-schema'
import { PROJECT_TASK_AI_ACTIONS } from '../lib/build-task-context'
import { taskCheckIcon, taskCopyIcon, taskLoadingIcon, taskSparklesIcon } from '../lib/project-icon-pack'
import type { TaskAiAction, TaskAiMessage } from '../lib/task-ai-types'

type ProjectTaskAiTabProps = {
  spaceId: string
  boardId: string
  rowId: string
  taskTitle: string
  taskContext: string
  schemaProperties: PropertyDefinition[]
  members: SpaceMember[]
  readOnly?: boolean
  variant?: 'panel' | 'sidebar'
}

export function ProjectTaskAiTab({
  spaceId,
  boardId,
  rowId,
  taskTitle,
  taskContext,
  schemaProperties,
  members,
  readOnly = false,
  variant = 'panel',
}: ProjectTaskAiTabProps) {
  const { data: settings, isLoading } = useAiSettings()
  const updateCell = useUpdateCell(spaceId, boardId)
  const { messages, isLoading: isThinking, error, sendMessage, stop, reset, markActionApplied } =
    useTaskAiAgent()
  const [draft, setDraft] = useState('')
  const [applyingKey, setApplyingKey] = useState<string | null>(null)

  const aiProperties = useMemo(
    () => buildTaskAiPropertySchema(schemaProperties),
    [schemaProperties],
  )

  const aiMembers = useMemo(
    () => members.map((member) => ({ userId: member.userId, name: member.name })),
    [members],
  )

  useEffect(() => {
    setDraft('')
    reset()
  }, [taskContext, rowId, reset])

  async function handleSend(text?: string) {
    const trimmed = (text ?? draft).trim()
    if (!trimmed || isThinking || !settings?.hasApiKey) return

    setDraft('')
    await sendMessage({
      prompt: trimmed,
      taskTitle,
      taskContext,
      properties: aiProperties,
      members: aiMembers,
      model: settings.defaultModel,
    })
  }

  async function handleApplyAction(messageIndex: number, action: TaskAiAction) {
    if (readOnly || applyingKey) return

    const key = `${messageIndex}:${action.summary}`
    setApplyingKey(key)

    try {
      await applyTaskAiAction({
        action,
        rowId,
        properties: schemaProperties,
        updateCell: updateCell.mutateAsync,
      })
      markActionApplied(messageIndex, action.summary)
    } finally {
      setApplyingKey(null)
    }
  }

  async function handleApplyAll(messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) {
    if (readOnly || applyingKey) return

    const pending = actions.filter((action) => !appliedSummaries.includes(action.summary))
    if (pending.length === 0) return

    setApplyingKey(`all:${messageIndex}`)

    try {
      await applyTaskAiActions({
        actions: pending,
        rowId,
        properties: schemaProperties,
        updateCell: updateCell.mutateAsync,
      })
      for (const action of pending) {
        markActionApplied(messageIndex, action.summary)
      }
    } finally {
      setApplyingKey(null)
    }
  }

  if (isLoading) {
    return <p className="p-4 text-sm text-text-primary/50">Loading…</p>
  }

  if (!settings?.hasApiKey) {
    return (
      <div className={variant === 'sidebar' ? 'overflow-y-auto p-4' : 'p-4'}>
        <AiMissingKeyNotice />
      </div>
    )
  }

  const hasConversation = messages.length > 0 || isThinking

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MessageList
        variant={variant}
        messages={messages}
        isThinking={isThinking}
        error={error}
        readOnly={readOnly}
        applyingKey={applyingKey}
        onApplyAction={handleApplyAction}
        onApplyAll={handleApplyAll}
      />

      <Composer
        variant={variant}
        draft={draft}
        isThinking={isThinking}
        hasConversation={hasConversation}
        readOnly={readOnly}
        onDraftChange={setDraft}
        onSend={() => void handleSend()}
        onQuickAction={(prompt) => void handleSend(prompt)}
        onStop={stop}
      />

      <p
        className={cn(
          'shrink-0 border-t border-border bg-sidebar pb-3 text-[10px] leading-relaxed text-text-primary/35',
          variant === 'sidebar' ? 'px-3 pt-0' : 'px-4 pt-0',
        )}
      >
        Model configured in{' '}
        <Link to="/settings/ai" className="underline-offset-2 hover:underline">
          Settings → AI
        </Link>
        . Ask to update status, rewrite the description, set priority, and more.
      </p>
    </div>
  )
}

function MessageList({
  variant,
  messages,
  isThinking,
  error,
  readOnly,
  applyingKey,
  onApplyAction,
  onApplyAll,
}: {
  variant: 'panel' | 'sidebar'
  messages: TaskAiMessage[]
  isThinking: boolean
  error: string | null
  readOnly: boolean
  applyingKey: string | null
  onApplyAction: (messageIndex: number, action: TaskAiAction) => Promise<void>
  onApplyAll: (messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) => Promise<void>
}) {
  if (!messages.length && !isThinking) {
    return (
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          variant === 'sidebar' ? 'px-3 py-3' : 'px-4 py-4',
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/[0.06]">
            <WorkspaceIcon icon={taskSparklesIcon} size={iconSize.section} className="text-text-emphasis" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-text-emphasis">Ask about this task</p>
            <p className="text-[11px] leading-relaxed text-text-primary/45">
              I can answer questions or update the title, status, description, labels, and more.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto',
        variant === 'sidebar' ? 'space-y-3 px-3 py-3' : 'space-y-3 px-4 py-4',
      )}
    >
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.role}-${index}`}
          message={message}
          messageIndex={index}
          readOnly={readOnly}
          applyingKey={applyingKey}
          onApplyAction={onApplyAction}
          onApplyAll={onApplyAll}
        />
      ))}

      {isThinking ? (
        <div className="flex items-center gap-2 px-1 text-xs text-text-primary/50">
          <WorkspaceIcon icon={taskLoadingIcon} size={iconSize.section} className="animate-spin" />
          Thinking…
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}

function MessageBlock({
  message,
  messageIndex,
  readOnly,
  applyingKey,
  onApplyAction,
  onApplyAll,
}: {
  message: TaskAiMessage
  messageIndex: number
  readOnly: boolean
  applyingKey: string | null
  onApplyAction: (messageIndex: number, action: TaskAiAction) => Promise<void>
  onApplyAll: (messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) => Promise<void>
}) {
  const isUser = message.role === 'user'
  const appliedSummaries = message.appliedSummaries ?? []
  const actions = message.actions ?? []
  const pendingActions = actions.filter((action) => !appliedSummaries.includes(action.summary))

  return (
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      <ChatBubble message={message} />

      {!isUser && actions.length > 0 ? (
        <div className="w-full max-w-[92%] space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {actions.map((action) => {
              const isApplied = appliedSummaries.includes(action.summary)
              const key = `${messageIndex}:${action.summary}`
              const isApplying = applyingKey === key

              return (
                <button
                  key={action.summary}
                  type="button"
                  disabled={readOnly || isApplied || Boolean(applyingKey)}
                  onClick={() => void onApplyAction(messageIndex, action)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] tracking-dashboard transition-colors',
                    isApplied
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : 'border-border text-text-primary hover:bg-white/[0.05] disabled:opacity-40',
                  )}
                >
                  {isApplied ? (
                    <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
                  ) : isApplying ? (
                    <WorkspaceIcon icon={taskLoadingIcon} size={iconSize.section} className="animate-spin" />
                  ) : null}
                  {action.summary}
                </button>
              )
            })}
          </div>

          {pendingActions.length > 1 && !readOnly ? (
            <button
              type="button"
              disabled={Boolean(applyingKey)}
              onClick={() => void onApplyAll(messageIndex, actions, appliedSummaries)}
              className="text-[11px] tracking-dashboard text-text-emphasis underline-offset-2 hover:underline disabled:opacity-40"
            >
              Apply all changes
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ChatBubble({ message }: { message: TaskAiMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'group relative max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed tracking-dashboard',
          isUser
            ? 'bg-white/10 text-text-emphasis'
            : 'bg-white/[0.04] text-text-primary',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser ? (
          <button
            type="button"
            aria-label="Copy response"
            onClick={() => void navigator.clipboard.writeText(message.content)}
            className="absolute -right-1 -top-1 rounded-md border border-border bg-sidebar p-1 text-text-primary/50 opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100"
          >
            <WorkspaceIcon icon={taskCopyIcon} size={iconSize.section} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Composer({
  variant,
  draft,
  isThinking,
  hasConversation,
  readOnly,
  onDraftChange,
  onSend,
  onQuickAction,
  onStop,
}: {
  variant: 'panel' | 'sidebar'
  draft: string
  isThinking: boolean
  hasConversation: boolean
  readOnly: boolean
  onDraftChange: (value: string) => void
  onSend: () => void
  onQuickAction: (prompt: string) => void
  onStop: () => void
}) {
  return (
    <div
      className={cn(
        'shrink-0 space-y-2.5 border-t border-border bg-sidebar py-3',
        variant === 'sidebar' ? 'px-3' : 'px-4',
      )}
    >
      {!hasConversation ? (
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_TASK_AI_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isThinking || readOnly}
              onClick={() => onQuickAction(action.prompt)}
              className={cn(
                'rounded-full border border-border px-2.5 py-1 text-[11px] tracking-dashboard',
                'text-text-primary transition-colors hover:bg-white/[0.05] disabled:opacity-40',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSend()
        }}
      >
        <textarea
          value={draft}
          disabled={isThinking || readOnly}
          rows={variant === 'sidebar' ? 2 : 3}
          placeholder={readOnly ? 'Read-only task' : 'Ask or tell me what to change…'}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
          className={cn(
            'min-h-0 flex-1 resize-none rounded-xl border border-border bg-sidebar px-3 py-2',
            'text-sm tracking-dashboard text-text-emphasis outline-none',
            'placeholder:text-text-primary/40 focus:border-white/20 disabled:opacity-40',
          )}
        />

        {isThinking ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs tracking-dashboard text-text-primary hover:bg-white/[0.05]"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim() || readOnly}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs tracking-dashboard text-text-emphasis hover:bg-white/14 disabled:opacity-40"
          >
            <WorkspaceIcon icon={taskSparklesIcon} size={iconSize.section} />
            Send
          </button>
        )}
      </form>
    </div>
  )
}
