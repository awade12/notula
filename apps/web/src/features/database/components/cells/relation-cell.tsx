import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { PropertyDefinition } from '@notesapp/shared'
import { cn } from '@/lib/cn'
import { dbCellDisplay } from '@/features/database/lib/database-classes'

type RelationCellProps = {
  rowId: string
  propertyId: string
  property: PropertyDefinition
  value: unknown
  pages: FlatPage[]
  onCommit: (value: unknown) => void
  readOnly?: boolean
}

export function RelationCell({
  property,
  value,
  pages,
  onCommit,
  readOnly = false,
}: RelationCellProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedIds = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  const limit = property.config?.limit ?? 10

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      inputRef.current?.focus()
    }
  }, [open])

  const selectedPages = useMemo(
    () => pages.filter((page) => selectedIds.includes(page.id)),
    [pages, selectedIds],
  )

  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return pages.slice(0, 50)
    return pages
      .filter((page) => page.title.toLowerCase().includes(normalized))
      .slice(0, 50)
  }, [pages, query])

  const togglePage = (pageId: string) => {
    const next = selectedIds.includes(pageId)
      ? selectedIds.filter((id) => id !== pageId)
      : [...selectedIds, pageId].slice(0, limit)
    onCommit(next)
  }

  return (
    <div ref={rootRef} className="relative min-w-0 px-2.5 py-0">
      <button
        type="button"
        onClick={() => {
          if (readOnly) return
          setOpen((current) => !current)
        }}
        className={cn(dbCellDisplay, 'min-h-8 w-full gap-1 py-0')}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedPages.length === 0 ? (
            <span className="text-sm text-text-primary/30">Empty</span>
          ) : (
            selectedPages.map((page) => (
              <span
                key={page.id}
                className="inline-flex max-w-full items-center gap-1 rounded-sm bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-text-emphasis"
              >
                {page.icon ? <PageIconDisplay value={page.icon} size={12} /> : null}
                <span className="truncate">{page.title}</span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="ml-auto size-3 shrink-0 text-text-primary/30" strokeWidth={1.75} />
      </button>

      {open ? (
        <div className="absolute left-2 right-2 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2 py-2">
            <Search className="size-3.5 shrink-0 text-text-primary/40" strokeWidth={1.75} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Link pages…"
              className="min-w-0 flex-1 bg-transparent text-xs text-text-emphasis outline-none placeholder:text-text-primary/35"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filteredPages.length === 0 ? (
              <p className="px-2 py-2 text-xs text-text-primary/50">No pages found</p>
            ) : (
              filteredPages.map((page) => {
                const selected = selectedIds.includes(page.id)
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => togglePage(page.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                      selected
                        ? 'bg-white/[0.06] text-text-emphasis'
                        : 'text-text-primary/70 hover:bg-white/[0.04]',
                    )}
                  >
                    <span className="flex size-4 items-center justify-center">
                      {selected ? <Check className="size-3" strokeWidth={2} /> : null}
                    </span>
                    {page.icon ? <PageIconDisplay value={page.icon} size={12} /> : null}
                    <span className="truncate">{page.title || 'Untitled'}</span>
                  </button>
                )
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
            <span className="text-[10px] text-text-primary/45">
              {selectedIds.length}/{limit}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-[10px] text-text-primary/55 hover:text-text-emphasis"
            >
              <X className="size-3" strokeWidth={1.75} />
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
