import { useEffect, useRef } from 'react'
import { AiMarkdownBody } from '@/features/ai/components/ai-markdown-body'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import type { TaskAiAction, TaskAiCreateTask, TaskAiMember, TaskAiMessage, TaskAiProperty } from '@/features/projects/lib/task-ai-types'
import { taskAiIcon, taskCheckIcon, taskCopyIcon, taskLoadingIcon } from '@/features/projects/lib/project-icon-pack'
import { ProjectTaskAiActionRow } from './project-task-ai-action-row'

type ProjectTaskAiMessagesProps = {
  spaceId: string
  variant: 'panel' | 'sidebar'
  messages: TaskAiMessage[]
  isThinking: boolean
  error: string | null
  taskTitle: string
  linkedPageTitle?: string
  aiProperties: TaskAiProperty[]
  aiMembers?: TaskAiMember[]
  readOnly: boolean
  applyingKey: string | null
  onApplyAction: (messageIndex: number, action: TaskAiAction) => Promise<void>
  onApplyAll: (messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) => Promise<void>
  onApplyCreate: (messageIndex: number, create: TaskAiCreateTask) => Promise<void>
  onApplyAllCreates: (
    messageIndex: number,
    creates: TaskAiCreateTask[],
    appliedCreateTitles: string[],
  ) => Promise<void>
}

export function ProjectTaskAiMessages({
  spaceId,
  variant,
  messages,
  isThinking,
  error,
  taskTitle,
  linkedPageTitle,
  aiProperties,
  aiMembers,
  readOnly,
  applyingKey,
  onApplyAction,
  onApplyAll,
  onApplyCreate,
  onApplyAllCreates,
}: ProjectTaskAiMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isThinking, error])

  const padding = variant === 'sidebar' ? 'px-3 py-3' : 'px-5 py-5'
  const isEmpty = messages.length === 0 && !isThinking && !error

  return (
    <div ref={scrollRef} className={cn('scrollbar-none min-h-0 flex-1 overflow-y-auto', padding)}>
      {isEmpty ? (
        <EmptyState taskTitle={taskTitle} linkedPageTitle={linkedPageTitle} />
      ) : (
        <div className="flex flex-col gap-5 pb-1">
          {messages.map((message, index) => (
            <MessageTurn
              key={`${message.role}-${index}`}
              spaceId={spaceId}
              message={message}
              messageIndex={index}
              readOnly={readOnly}
              applyingKey={applyingKey}
              aiProperties={aiProperties}
              aiMembers={aiMembers}
              onApplyAction={onApplyAction}
              onApplyAll={onApplyAll}
              onApplyCreate={onApplyCreate}
              onApplyAllCreates={onApplyAllCreates}
            />
          ))}

          {isThinking ? <ThinkingIndicator /> : null}
          {error ? <TaskAiErrorNotice error={error} /> : null}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  taskTitle,
  linkedPageTitle,
}: {
  taskTitle: string
  linkedPageTitle?: string
}) {
  return (
    <div className="flex min-h-[12rem] flex-col justify-center gap-4 px-1 py-6">
      <div className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-white/[0.04]">
        <WorkspaceIcon icon={taskAiIcon} size={iconSize.section} className="text-text-primary/55" />
      </div>
      <div className="space-y-2">
        <p className="text-[15px] leading-snug text-text-emphasis">
          Edit{' '}
          <span className="font-medium">{taskTitle.trim() || 'this task'}</span> with AI
        </p>
        <p className="max-w-sm text-[13px] leading-relaxed text-text-primary/45">
          I already see the title, description, status, and fields. Ask for a richer writeup, a
          breakdown, or property changes — then apply what you want.
        </p>
      </div>
      {linkedPageTitle ? (
        <p className="text-[12px] text-text-primary/35">Linked doc · {linkedPageTitle}</p>
      ) : null}
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
            className="size-1.5 rounded-full bg-text-primary/35 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-[12px] text-text-primary/40">Thinking</span>
    </div>
  )
}

function TaskAiErrorNotice({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5">
      <p className="text-[13px] leading-relaxed text-red-300/90">{error}</p>
    </div>
  )
}

function MessageTurn({
  spaceId,
  message,
  messageIndex,
  readOnly,
  applyingKey,
  onApplyAction,
  onApplyAll,
  onApplyCreate,
  onApplyAllCreates,
  aiProperties,
  aiMembers,
}: {
  spaceId: string
  message: TaskAiMessage
  messageIndex: number
  readOnly: boolean
  applyingKey: string | null
  onApplyAction: (messageIndex: number, action: TaskAiAction) => Promise<void>
  onApplyAll: (messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) => Promise<void>
  onApplyCreate: (messageIndex: number, create: TaskAiCreateTask) => Promise<void>
  onApplyAllCreates: (
    messageIndex: number,
    creates: TaskAiCreateTask[],
    appliedCreateTitles: string[],
  ) => Promise<void>
  aiProperties: TaskAiProperty[]
  aiMembers?: TaskAiMember[]
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

  const appliedSummaries = message.appliedSummaries ?? []
  const appliedCreateTitles = message.appliedCreateTitles ?? []
  const actions = message.actions ?? []
  const createTasks = message.createTasks ?? []
  const pendingActions = actions.filter((action) => !appliedSummaries.includes(action.summary))
  const pendingCreates = createTasks.filter((create) => !appliedCreateTitles.includes(create.title))

  return (
    <div className="group space-y-3 pr-1">
      <div className="relative">
        <AiMarkdownBody
          content={message.content}
          spaceId={spaceId}
          className="text-[13px] leading-[1.7] text-text-primary/88 [&_p]:text-text-primary/88"
        />
        <button
          type="button"
          aria-label="Copy response"
          onClick={() => void navigator.clipboard.writeText(message.content)}
          className="absolute -right-0.5 top-0 rounded-md p-1 text-text-primary/30 opacity-0 transition-opacity hover:text-text-primary/70 group-hover:opacity-100"
        >
          <WorkspaceIcon icon={taskCopyIcon} size={iconSize.section} />
        </button>
      </div>

      {actions.length > 0 ? (
        <ProposedChangesCard
          spaceId={spaceId}
          messageIndex={messageIndex}
          actions={actions}
          appliedSummaries={appliedSummaries}
          pendingActions={pendingActions}
          readOnly={readOnly}
          applyingKey={applyingKey}
          aiProperties={aiProperties}
          aiMembers={aiMembers}
          onApplyAction={onApplyAction}
          onApplyAll={onApplyAll}
        />
      ) : null}

      {createTasks.length > 0 ? (
        <ProposedCreatesCard
          messageIndex={messageIndex}
          creates={createTasks}
          appliedCreateTitles={appliedCreateTitles}
          pendingCreates={pendingCreates}
          readOnly={readOnly}
          applyingKey={applyingKey}
          onApplyCreate={onApplyCreate}
          onApplyAllCreates={onApplyAllCreates}
        />
      ) : null}
    </div>
  )
}

function ProposedCreatesCard({
  messageIndex,
  creates,
  appliedCreateTitles,
  pendingCreates,
  readOnly,
  applyingKey,
  onApplyCreate,
  onApplyAllCreates,
}: {
  messageIndex: number
  creates: TaskAiCreateTask[]
  appliedCreateTitles: string[]
  pendingCreates: TaskAiCreateTask[]
  readOnly: boolean
  applyingKey: string | null
  onApplyCreate: (messageIndex: number, create: TaskAiCreateTask) => Promise<void>
  onApplyAllCreates: (
    messageIndex: number,
    creates: TaskAiCreateTask[],
    appliedCreateTitles: string[],
  ) => Promise<void>
}) {
  const allApplied = pendingCreates.length === 0

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/30">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <p className="text-[11px] font-medium tracking-wide text-text-primary/45">
          New tasks
        </p>
        {pendingCreates.length > 1 && !readOnly ? (
          <button
            type="button"
            disabled={Boolean(applyingKey)}
            onClick={() => void onApplyAllCreates(messageIndex, creates, appliedCreateTitles)}
            className="text-[11px] text-text-primary/55 transition-colors hover:text-text-emphasis disabled:opacity-40"
          >
            Create all
          </button>
        ) : allApplied ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-green-400/85">
            <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
            Created
          </span>
        ) : null}
      </div>

      <ul className="divide-y divide-border/30">
        {creates.map((create) => {
          const isApplied = appliedCreateTitles.includes(create.title)
          const isApplying =
            applyingKey === `create:${messageIndex}:${create.title}` ||
            applyingKey === `create-all:${messageIndex}`

          return (
            <li key={create.title} className="px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      'text-[13px] font-medium leading-snug',
                      isApplied ? 'text-text-primary/40 line-through' : 'text-text-primary/85',
                    )}
                  >
                    {create.title}
                  </p>
                  {create.description?.trim() ? (
                    <p className="line-clamp-3 text-[12px] leading-relaxed text-text-primary/55">
                      {create.description.trim()}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 pt-0.5">
                  {isApplied ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-400/85">
                      <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
                      Done
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={readOnly || Boolean(applyingKey)}
                      onClick={() => void onApplyCreate(messageIndex, create)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                        'bg-text-emphasis text-sidebar hover:opacity-90 disabled:opacity-40',
                      )}
                    >
                      {isApplying ? (
                        <WorkspaceIcon
                          icon={taskLoadingIcon}
                          size={iconSize.section}
                          className="animate-spin"
                        />
                      ) : null}
                      Create
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProposedChangesCard({
  spaceId,
  messageIndex,
  actions,
  appliedSummaries,
  pendingActions,
  readOnly,
  applyingKey,
  aiProperties,
  aiMembers,
  onApplyAction,
  onApplyAll,
}: {
  spaceId: string
  messageIndex: number
  actions: TaskAiAction[]
  appliedSummaries: string[]
  pendingActions: TaskAiAction[]
  readOnly: boolean
  applyingKey: string | null
  aiProperties: TaskAiProperty[]
  aiMembers?: TaskAiMember[]
  onApplyAction: (messageIndex: number, action: TaskAiAction) => Promise<void>
  onApplyAll: (messageIndex: number, actions: TaskAiAction[], appliedSummaries: string[]) => Promise<void>
}) {
  const allApplied = pendingActions.length === 0

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/30">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <p className="text-[11px] font-medium tracking-wide text-text-primary/45">
          Proposed changes
        </p>
        {pendingActions.length > 1 && !readOnly ? (
          <button
            type="button"
            disabled={Boolean(applyingKey)}
            onClick={() => void onApplyAll(messageIndex, actions, appliedSummaries)}
            className="text-[11px] text-text-primary/55 transition-colors hover:text-text-emphasis disabled:opacity-40"
          >
            Apply all
          </button>
        ) : allApplied ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-green-400/85">
            <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} />
            Applied
          </span>
        ) : null}
      </div>

      <ul className="divide-y divide-border/30">
        {actions.map((action) => {
          const isApplied = appliedSummaries.includes(action.summary)
          const key = `${messageIndex}:${action.propertyId}:${action.summary}`
          const isApplying = applyingKey === `${messageIndex}:${action.summary}` || applyingKey === `all:${messageIndex}`

          return (
            <ProjectTaskAiActionRow
              key={key}
              spaceId={spaceId}
              action={action}
              properties={aiProperties}
              members={aiMembers}
              isApplied={isApplied}
              isApplying={isApplying}
              readOnly={readOnly}
              disabled={Boolean(applyingKey)}
              onApply={() => void onApplyAction(messageIndex, action)}
            />
          )
        })}
      </ul>
    </div>
  )
}
