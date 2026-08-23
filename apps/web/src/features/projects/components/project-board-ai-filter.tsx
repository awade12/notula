import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { FilterRule } from '@notesapp/shared'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { TaskAiProperty } from '@/features/projects/lib/task-ai-types'

type ProjectBoardAiFilterProps = {
  spaceId: string
  properties: TaskAiProperty[]
  model?: string
  disabled?: boolean
  onApply: (filters: FilterRule[]) => void
}

export function ProjectBoardAiFilter({
  spaceId,
  properties,
  model,
  disabled = false,
  onApply,
}: ProjectBoardAiFilterProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply() {
    const trimmed = prompt.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${getApiUrl()}/api/ai/parse-board-filter`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          prompt: trimmed,
          properties,
          model,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Could not parse filters')
      }

      const data = (await response.json()) as { filters: FilterRule[] }
      onApply(data.filters)
      setPrompt('')
      setOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not parse filters')
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-[11px]',
          'text-text-primary/60 transition-colors hover:border-border hover:bg-white/[0.04] hover:text-text-emphasis disabled:opacity-40',
        )}
      >
        <Sparkles size={12} strokeWidth={1.75} aria-hidden />
        AI filter
      </button>
    )
  }

  return (
    <div className="flex min-w-[16rem] flex-col gap-2">
      <input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        autoFocus
        disabled={isLoading}
        placeholder='e.g. "overdue bugs assigned to me"'
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void handleApply()
          }
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        className="w-full rounded-lg border border-border/60 bg-white/[0.03] px-2.5 py-2 text-[12px] text-text-emphasis outline-none placeholder:text-text-primary/35"
      />
      {error ? <p className="text-[11px] text-red-300/85">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setOpen(false)}
          className="text-[11px] text-text-primary/45 hover:text-text-primary/70"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isLoading || !prompt.trim()}
          onClick={() => void handleApply()}
          className="rounded-md bg-text-emphasis px-2.5 py-1 text-[11px] font-medium text-sidebar hover:opacity-90 disabled:opacity-40"
        >
          {isLoading ? 'Parsing…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
