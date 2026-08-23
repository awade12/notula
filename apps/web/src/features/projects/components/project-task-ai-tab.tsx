import { useEffect, useMemo, useState } from 'react'
import { type PropertyDefinition } from '@notesapp/shared'
import { AiMissingKeyNotice } from '@/features/ai/components/ai-model-picker'
import { notifyTaskAiApplied } from '@/features/notifications/hooks/use-notifications'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { useCreateRow, useUpdateCell } from '@/features/database/hooks/use-update-cell'
import type { SpaceMember } from '@/features/workspace/hooks/use-space-members'
import { useTaskAiAgent } from '../hooks/use-task-ai-agent'
import { applyTaskAiAction, applyTaskAiActions } from '../lib/apply-task-ai-action'
import { applyTaskAiCreate, applyTaskAiCreates } from '../lib/apply-task-ai-create'
import { buildTaskAiPropertySchema } from '../lib/build-task-ai-schema'
import type { TaskAiAction, TaskAiCreateTask } from '../lib/task-ai-types'
import { ProjectTaskAiComposer } from './project-task-ai-composer'
import { ProjectTaskAiMessages } from './project-task-ai-messages'

type ProjectTaskAiTabProps = {
  spaceId: string
  boardId: string
  rowId: string
  taskTitle: string
  taskContext: string
  linkedPageId?: string
  linkedPageTitle?: string
  schemaProperties: PropertyDefinition[]
  members: SpaceMember[]
  assigneeIds?: string[]
  readOnly?: boolean
  variant?: 'panel' | 'sidebar'
}

export function ProjectTaskAiTab({
  spaceId,
  boardId,
  rowId,
  taskTitle,
  taskContext,
  linkedPageId,
  linkedPageTitle,
  schemaProperties,
  members,
  assigneeIds = [],
  readOnly = false,
  variant = 'panel',
}: ProjectTaskAiTabProps) {
  const { data: session } = useSession()
  const { data: settings, isLoading } = useAiSettings()
  const updateCell = useUpdateCell(spaceId, boardId)
  const createRow = useCreateRow(spaceId, boardId)
  const chatStorageKey = `${boardId}:${rowId}`
  const { messages, isLoading: isThinking, error, sendMessage, stop, markActionApplied, markCreateApplied } =
    useTaskAiAgent(chatStorageKey)
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
  }, [rowId])

  async function handleSend(text?: string) {
    const trimmed = (text ?? draft).trim()
    if (!trimmed || isThinking || !settings?.hasApiKey) return
    if (aiProperties.length === 0) return

    setDraft('')
    await sendMessage({
      prompt: trimmed,
      spaceId,
      boardId,
      taskId: rowId,
      linkedPageId,
      taskTitle,
      taskContext,
      properties: aiProperties,
      members: aiMembers,
      model: settings.defaultModel,
    })
  }

  async function notifyAssigneesIfNeeded(summaries: string[]) {
    const recipients = assigneeIds.filter((userId) => userId !== session?.user?.id)
    if (recipients.length === 0) return

    await notifyTaskAiApplied({
      spaceId,
      boardId,
      rowId,
      taskTitle,
      summary: summaries.join(', '),
      recipientUserIds: recipients,
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
      await notifyAssigneesIfNeeded([action.summary])
    } finally {
      setApplyingKey(null)
    }
  }

  async function handleApplyAll(
    messageIndex: number,
    actions: TaskAiAction[],
    appliedSummaries: string[],
  ) {
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
      await notifyAssigneesIfNeeded(pending.map((action) => action.summary))
    } finally {
      setApplyingKey(null)
    }
  }

  async function handleApplyCreate(messageIndex: number, create: TaskAiCreateTask) {
    if (readOnly || applyingKey) return

    setApplyingKey(`create:${messageIndex}:${create.title}`)

    try {
      await applyTaskAiCreate({
        create,
        schemaProperties,
        createRow: createRow.mutateAsync,
      })
      markCreateApplied(messageIndex, create.title)
    } finally {
      setApplyingKey(null)
    }
  }

  async function handleApplyAllCreates(
    messageIndex: number,
    creates: TaskAiCreateTask[],
    appliedCreateTitles: string[],
  ) {
    if (readOnly || applyingKey) return

    const pending = creates.filter((create) => !appliedCreateTitles.includes(create.title))
    if (pending.length === 0) return

    setApplyingKey(`create-all:${messageIndex}`)

    try {
      await applyTaskAiCreates({
        creates: pending,
        schemaProperties,
        createRow: createRow.mutateAsync,
      })
      for (const create of pending) {
        markCreateApplied(messageIndex, create.title)
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

  const showSuggestions = messages.length === 0 && !isThinking

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ProjectTaskAiMessages
        spaceId={spaceId}
        variant={variant}
        messages={messages}
        isThinking={isThinking}
        error={error}
        taskTitle={taskTitle}
        linkedPageTitle={linkedPageTitle}
        aiProperties={aiProperties}
        aiMembers={aiMembers}
        readOnly={readOnly}
        applyingKey={applyingKey}
        onApplyAction={handleApplyAction}
        onApplyAll={handleApplyAll}
        onApplyCreate={handleApplyCreate}
        onApplyAllCreates={handleApplyAllCreates}
      />

      <ProjectTaskAiComposer
        variant={variant}
        draft={draft}
        isThinking={isThinking}
        readOnly={readOnly}
        showSuggestions={showSuggestions}
        onDraftChange={setDraft}
        onSend={() => void handleSend()}
        onQuickAction={(prompt) => void handleSend(prompt)}
        onStop={stop}
      />
    </div>
  )
}
