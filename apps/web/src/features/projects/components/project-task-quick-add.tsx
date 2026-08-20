import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

type ProjectTaskQuickAddProps = {
  onSubmit: (title: string) => Promise<void>
  disabled?: boolean
}

export function ProjectTaskQuickAdd({ onSubmit, disabled }: ProjectTaskQuickAddProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  async function submit() {
    const title = draft.trim()
    if (!title || submitting || disabled) {
      if (!title) setOpen(false)
      setDraft('')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(title)
      setDraft('')
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-left text-xs text-text-primary/45',
          'transition-colors hover:bg-white/[0.04] hover:text-text-primary/70 disabled:opacity-50',
        )}
      >
        <Plus className="size-3.5 shrink-0" strokeWidth={1.75} />
        Add task
      </button>
    )
  }

  return (
    <div className="rounded-md border border-white/10 bg-background/60 p-2 shadow-sm ring-1 ring-white/5">
      <input
        ref={inputRef}
        value={draft}
        disabled={submitting || disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void submit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setDraft('')
            setOpen(false)
          }
        }}
        onBlur={() => {
          if (!draft.trim()) {
            setOpen(false)
          }
        }}
        placeholder="Task title"
        className="w-full bg-transparent text-sm text-text-emphasis outline-none placeholder:text-text-primary/35"
      />
      <p className="mt-1.5 text-[10px] tracking-wide text-text-primary/30">
        Enter to add · Esc to close
      </p>
    </div>
  )
}
