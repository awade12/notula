import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/cn'
import { useSearch } from '../hooks/use-search'
import { SearchInput } from './search-input'
import { SearchResultRow } from './search-result-row'

type SearchDialogProps = {
  spaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ spaceId, open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { data: results = [], isFetching } = useSearch(spaceId, query)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
      return
    }

    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        return
      }

      if (results.length === 0) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, results.length - 1))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const result = results[activeIndex]
        if (result) {
          void navigate({
            to: '/s/$spaceId/p/$pageId',
            params: { spaceId, pageId: result.id },
          })
          onOpenChange(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, navigate, onOpenChange, open, results, spaceId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border',
          'bg-surface shadow-xl',
        )}
      >
        <SearchInput value={query} onChange={setQuery} inputRef={inputRef} />

        <div className="scrollbar-none max-h-80 overflow-y-auto p-1">
          {query.trim().length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-text-primary/50">
              Type to search page titles and content
            </p>
          ) : isFetching && results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-text-primary/50">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-text-primary/50">No results</p>
          ) : (
            results.map((result, index) => (
              <SearchResultRow
                key={result.id}
                result={result}
                isActive={index === activeIndex}
                onSelect={() => {
                  void navigate({
                    to: '/s/$spaceId/p/$pageId',
                    params: { spaceId, pageId: result.id },
                  })
                  onOpenChange(false)
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
