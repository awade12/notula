import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useProjectBoards } from '@/features/projects/hooks/use-project-boards'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/cn'

type PageSpecToTasksDialogProps = {
  spaceId: string
  pageId: string
  pageTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SpecTaskPreview = {
  title: string
  description?: string
}

export function PageSpecToTasksDialog({
  spaceId,
  pageId,
  pageTitle,
  open,
  onOpenChange,
}: PageSpecToTasksDialogProps) {
  const navigate = useNavigate()
  const { data: boards = [] } = useProjectBoards(spaceId)
  const [boardId, setBoardId] = useState('')
  const [preview, setPreview] = useState<SpecTaskPreview[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handlePreview() {
    if (!boardId || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${getApiUrl()}/api/ai/spec-to-tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, pageId, boardId, create: false }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Could not break spec into tasks')
      }

      const data = (await response.json()) as {
        tasks: SpecTaskPreview[]
        summary?: string
      }
      setPreview(data.tasks)
      setSummary(data.summary ?? null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!boardId || isCreating) return
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch(`${getApiUrl()}/api/ai/spec-to-tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, pageId, boardId, create: true }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Could not create tasks')
      }

      onOpenChange(false)
      await navigate({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId, boardId },
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-surface p-4 shadow-xl">
        <h2 className="text-sm font-medium text-text-emphasis">Break spec into tasks</h2>
        <p className="mt-1 text-xs text-text-primary/50">
          Turn <span className="font-medium">{pageTitle}</span> into board tasks.
        </p>

        <label className="mt-4 block text-xs text-text-primary/55">Target board</label>
        <select
          value={boardId}
          onChange={(event) => {
            setBoardId(event.target.value)
            setPreview([])
            setSummary(null)
          }}
          className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Select a board…</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.title}
            </option>
          ))}
        </select>

        {summary ? <p className="mt-3 text-xs text-text-primary/55">{summary}</p> : null}

        {preview.length > 0 ? (
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-md border border-border/60 p-2">
            {preview.map((task) => (
              <li key={task.title} className="text-xs text-text-primary/70">
                <span className="font-medium text-text-emphasis">{task.title}</span>
                {task.description ? (
                  <p className="mt-0.5 line-clamp-2 text-text-primary/45">{task.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-3 py-1.5 text-xs text-text-primary/55 hover:bg-sidebar"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!boardId || isLoading}
            onClick={() => void handlePreview()}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-text-primary/70 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : 'Preview'}
          </button>
          <button
            type="button"
            disabled={!boardId || preview.length === 0 || isCreating}
            onClick={() => void handleCreate()}
            className={cn(
              'rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40',
            )}
          >
            {isCreating ? 'Creating…' : 'Create tasks'}
          </button>
        </div>
      </div>
    </div>
  )
}
