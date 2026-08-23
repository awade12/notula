import { AtSign, FileText, ListTodo, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  isSearchPageResult,
  isSearchTaskResult,
  useSearch,
  type SearchResult,
} from '@/features/search/hooks/use-search'
import { cn } from '@/lib/cn'
import type { PageAiContextRef } from '../types/page-ai'

type PageAiContextPickerProps = {
  spaceId: string
  contextRefs: PageAiContextRef[]
  disabled?: boolean
  onChange: (refs: PageAiContextRef[]) => void
}

export function PageAiContextPicker({
  spaceId,
  contextRefs,
  disabled = false,
  onChange,
}: PageAiContextPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const { data: results = [], isFetching } = useSearch(spaceId, query)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function addResult(result: SearchResult) {
    if (contextRefs.length >= 8) return

    if (isSearchPageResult(result)) {
      if (contextRefs.some((ref) => ref.type === 'note' && ref.id === result.id)) return
      onChange([...contextRefs, { type: 'note', id: result.id, title: result.title }])
    }

    if (isSearchTaskResult(result)) {
      if (contextRefs.some((ref) => ref.type === 'task' && ref.id === result.id)) return
      onChange([
        ...contextRefs,
        {
          type: 'task',
          id: result.id,
          boardId: result.boardId,
          title: result.title,
          boardTitle: result.boardTitle,
        },
      ])
    }

    setQuery('')
    setOpen(false)
  }

  function removeRef(index: number) {
    onChange(contextRefs.filter((_, itemIndex) => itemIndex !== index))
  }

  const filteredResults = results.filter((result) => {
    if (isSearchPageResult(result)) {
      return !contextRefs.some((ref) => ref.type === 'note' && ref.id === result.id)
    }
    if (isSearchTaskResult(result)) {
      return !contextRefs.some((ref) => ref.type === 'task' && ref.id === result.id)
    }
    return false
  })

  return (
    <div ref={rootRef} className="mb-2 space-y-2">
      {contextRefs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {contextRefs.map((ref, index) => (
            <span
              key={`${ref.type}-${ref.id}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/50 bg-white/[0.04] py-0.5 pl-2 pr-1 text-[11px] text-text-primary/70"
            >
              {ref.type === 'note' ? (
                <FileText size={11} strokeWidth={1.75} aria-hidden />
              ) : (
                <ListTodo size={11} strokeWidth={1.75} aria-hidden />
              )}
              <span className="truncate">{ref.title.trim() || 'Untitled'}</span>
              <button
                type="button"
                aria-label={`Remove ${ref.title}`}
                disabled={disabled}
                onClick={() => removeRef(index)}
                className="rounded-full p-0.5 text-text-primary/35 hover:bg-white/[0.06] hover:text-text-primary/70 disabled:opacity-40"
              >
                <X size={11} strokeWidth={1.75} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <button
          type="button"
          disabled={disabled || contextRefs.length >= 8}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1 text-[11px]',
            'text-text-primary/55 transition-colors hover:border-border hover:bg-white/[0.04] hover:text-text-emphasis disabled:opacity-40',
          )}
        >
          <AtSign size={12} strokeWidth={1.75} aria-hidden />
          Add context
        </button>

        {open ? (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border/70 bg-sidebar shadow-lg">
            <div className="border-b border-border/40 px-3 py-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search notes and tasks…"
                className="w-full bg-transparent text-[13px] text-text-emphasis outline-none placeholder:text-text-primary/35"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {query.trim().length === 0 ? (
                <p className="px-2.5 py-2 text-[12px] text-text-primary/40">
                  Attach notes or tasks for the AI to read.
                </p>
              ) : isFetching ? (
                <p className="px-2.5 py-2 text-[12px] text-text-primary/40">Searching…</p>
              ) : filteredResults.length === 0 ? (
                <p className="px-2.5 py-2 text-[12px] text-text-primary/40">No matches</p>
              ) : (
                filteredResults.slice(0, 8).map((result) => (
                  <button
                    key={`${result.resultType}-${result.id}`}
                    type="button"
                    onClick={() => addResult(result)}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.05]"
                  >
                    {isSearchPageResult(result) ? (
                      <FileText size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-text-primary/45" />
                    ) : (
                      <ListTodo size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-text-primary/45" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-text-emphasis">
                        {result.title.trim() || 'Untitled'}
                      </span>
                      {'boardTitle' in result ? (
                        <span className="block truncate text-[11px] text-text-primary/40">
                          {result.boardTitle}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
