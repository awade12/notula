import { Loader2, RotateCcw, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PropertyDefinition } from '@notesapp/shared'
import { useCreateRow } from '@/features/database/hooks/use-update-cell'
import { ProjectBoardIdeaTaskPreviewList } from '@/features/projects/components/project-board-idea-task-preview-list'
import { applyTaskAiCreates } from '@/features/projects/lib/apply-task-ai-create'
import { IDEA_TO_TASKS_REFINEMENT_SUGGESTIONS } from '@/features/projects/lib/idea-to-tasks-refinement-suggestions'
import type { TaskAiCreateTask } from '@/features/projects/lib/task-ai-types'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/cn'

type ProjectBoardIdeaToTasksDialogProps = {
  spaceId: string
  boardId: string
  boardTitle: string
  schemaProperties: PropertyDefinition[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type IdeaChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type IdeaToTasksResponse = {
  summary?: string
  reply?: string
  tasks: TaskAiCreateTask[]
}

function resetDialogState() {
  return {
    idea: '',
    preview: [] as TaskAiCreateTask[],
    summary: null as string | null,
    chatMessages: [] as IdeaChatMessage[],
    refineInput: '',
    hasPlan: false,
    error: null as string | null,
  }
}

export function ProjectBoardIdeaToTasksDialog({
  spaceId,
  boardId,
  boardTitle,
  schemaProperties,
  open,
  onOpenChange,
}: ProjectBoardIdeaToTasksDialogProps) {
  const createRow = useCreateRow(spaceId, boardId)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [idea, setIdea] = useState('')
  const [preview, setPreview] = useState<TaskAiCreateTask[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<IdeaChatMessage[]>([])
  const [refineInput, setRefineInput] = useState('')
  const [hasPlan, setHasPlan] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, chatMessages, preview, summary])

  useEffect(() => {
    if (open) return
    const next = resetDialogState()
    setIdea(next.idea)
    setPreview(next.preview)
    setSummary(next.summary)
    setChatMessages(next.chatMessages)
    setRefineInput(next.refineInput)
    setHasPlan(next.hasPlan)
    setError(next.error)
  }, [open])

  if (!open) return null

  async function requestPlan(input: {
    messages?: IdeaChatMessage[]
    currentTasks?: TaskAiCreateTask[]
  }) {
    const response = await fetch(`${getApiUrl()}/api/ai/idea-to-tasks`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId,
        boardId,
        idea: idea.trim(),
        create: false,
        messages: input.messages,
        currentTasks: input.currentTasks,
      }),
    })

    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      throw new Error(data.error ?? 'Could not plan tasks from idea')
    }

    return (await response.json()) as IdeaToTasksResponse
  }

  function applyPlanResponse(data: IdeaToTasksResponse, userMessage?: string) {
    setPreview(data.tasks)
    setSummary(data.summary ?? null)
    setHasPlan(true)

    const assistantText = data.reply ?? data.summary
    if (userMessage) {
      setChatMessages((current) => [
        ...current,
        { role: 'user', content: userMessage },
        ...(assistantText ? [{ role: 'assistant' as const, content: assistantText }] : []),
      ])
    } else if (assistantText) {
      setChatMessages([{ role: 'assistant', content: assistantText }])
    }
  }

  async function handleGenerate() {
    if (idea.trim().length < 10 || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const data = await requestPlan({})
      setChatMessages([])
      applyPlanResponse(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefine(message: string) {
    const trimmed = message.trim()
    if (!trimmed || isLoading || !hasPlan) return

    setIsLoading(true)
    setError(null)
    setRefineInput('')

    try {
      const nextMessages: IdeaChatMessage[] = [...chatMessages, { role: 'user', content: trimmed }]
      const data = await requestPlan({
        messages: nextMessages,
        currentTasks: preview,
      })
      applyPlanResponse(data, trimmed)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!hasPlan || preview.length === 0 || isCreating) return
    setIsCreating(true)
    setError(null)

    try {
      await applyTaskAiCreates({
        creates: preview,
        schemaProperties,
        createRow: createRow.mutateAsync,
      })
      onOpenChange(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed')
    } finally {
      setIsCreating(false)
    }
  }

  function handleStartOver() {
    const next = resetDialogState()
    setIdea(next.idea)
    setPreview(next.preview)
    setSummary(next.summary)
    setChatMessages(next.chatMessages)
    setRefineInput(next.refineInput)
    setHasPlan(next.hasPlan)
    setError(next.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-xl">
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-400" strokeWidth={1.75} />
              <h2 className="text-sm font-medium text-text-emphasis">Plan tasks from idea</h2>
            </div>
            {hasPlan ? (
              <button
                type="button"
                onClick={handleStartOver}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-primary/50 hover:bg-white/[0.04] hover:text-text-emphasis"
              >
                <RotateCcw className="size-3" />
                Start over
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-text-primary/50">
            {hasPlan
              ? 'Review the draft below, then ask for changes — e.g. one epic, fewer tasks, or more detail.'
              : `Describe your vision for ${boardTitle}. You can refine the plan before creating tasks.`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {!hasPlan ? (
            <>
              <label className="text-xs text-text-primary/55">Your idea</label>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                rows={8}
                placeholder="Paste a product pitch, game design doc, feature brainstorm, or rough notes — no task titles needed…"
                className="mt-1 w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm leading-relaxed text-text-emphasis placeholder:text-text-primary/35 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
              <p className="mt-1 text-[11px] text-text-primary/40">
                {idea.trim().length}/32000 · minimum 10 characters
              </p>
            </>
          ) : (
            <>
              <details className="rounded-md border border-border/60 bg-white/[0.02] px-3 py-2">
                <summary className="cursor-pointer text-xs text-text-primary/55">Original idea</summary>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-text-primary/45">
                  {idea.trim()}
                </p>
              </details>

              {summary ? (
                <p className="mt-3 rounded-md border border-border/60 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-text-primary/60">
                  {summary}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-text-emphasis">
                  Draft plan
                  <span className="ml-1.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-normal text-text-primary/50">
                    {preview.length} task{preview.length === 1 ? '' : 's'}
                  </span>
                </p>
              </div>

              <div className="mt-2">
                <ProjectBoardIdeaTaskPreviewList tasks={preview} />
              </div>

              {chatMessages.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={cn(
                        'rounded-md px-3 py-2 text-xs leading-relaxed',
                        message.role === 'user'
                          ? 'ml-8 bg-violet-500/10 text-text-emphasis'
                          : 'mr-8 bg-white/[0.04] text-text-primary/65',
                      )}
                    >
                      {message.content}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              ) : null}

              <div className="mt-4 border-t border-border/50 pt-3">
                <p className="text-[11px] text-text-primary/45">Quick adjustments</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {IDEA_TO_TASKS_REFINEMENT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void handleRefine(suggestion.prompt)}
                      className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-text-primary/60 transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-100 disabled:opacity-40"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleRefine(refineInput)
                  }}
                >
                  <input
                    value={refineInput}
                    onChange={(event) => setRefineInput(event.target.value)}
                    placeholder="Ask for changes… e.g. merge into one task"
                    disabled={isLoading}
                    className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-emphasis placeholder:text-text-primary/35 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                  />
                  <button
                    type="submit"
                    disabled={!refineInput.trim() || isLoading}
                    className="inline-flex items-center justify-center rounded-md bg-violet-600 px-3 py-2 text-white disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" strokeWidth={1.75} />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}

          {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-3 py-1.5 text-xs text-text-primary/55 hover:bg-sidebar"
          >
            Cancel
          </button>
          {!hasPlan ? (
            <button
              type="button"
              disabled={idea.trim().length < 10 || isLoading}
              onClick={() => void handleGenerate()}
              className={cn(
                'rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40',
              )}
            >
              {isLoading ? 'Planning…' : 'Generate plan'}
            </button>
          ) : (
            <button
              type="button"
              disabled={preview.length === 0 || isCreating || isLoading}
              onClick={() => void handleCreate()}
              className={cn(
                'rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40',
              )}
            >
              {isCreating
                ? 'Creating…'
                : `Create ${preview.length} task${preview.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
