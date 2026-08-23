import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { formatHotkeyLabel } from '@/features/settings/lib/hotkeys'
import { TeamspaceAskPanel } from '@/features/ai/components/teamspace-ask-panel'
import { cn } from '@/lib/cn'
import {
  isSearchPageResult,
  isSearchTaskResult,
  useSearch,
  type SearchResult,
} from '../hooks/use-search'
import { SearchInput } from './search-input'
import { SearchResultRow } from './search-result-row'

type SearchDialogProps = {
  spaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  teamspaceAskEnabled?: boolean
  initialMode?: 'search' | 'ask'
}

function navigateToSearchResult(
  navigate: ReturnType<typeof useNavigate>,
  spaceId: string,
  result: SearchResult,
) {
  if (isSearchTaskResult(result)) {
    return navigate({
      to: '/s/$spaceId/projects/$boardId',
      params: { spaceId, boardId: result.boardId },
      search: { task: result.id },
    })
  }

  return navigate({
    to: '/s/$spaceId/p/$pageId',
    params: { spaceId, pageId: result.id },
  })
}

export function SearchDialog({
  spaceId,
  open,
  onOpenChange,
  teamspaceAskEnabled = false,
  initialMode = 'search',
}: SearchDialogProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'search' | 'ask'>(initialMode)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { data: results = [], isFetching } = useSearch(spaceId, query)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
      setMode('search')
      return
    }

    setMode(initialMode)
    if (initialMode === 'search') {
      inputRef.current?.focus()
    }
  }, [open, initialMode])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length])

  useEffect(() => {
    if (!open || mode !== 'search') return

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
          void navigateToSearchResult(navigate, spaceId, result).then(() => {
            onOpenChange(false)
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, mode, navigate, onOpenChange, open, results, spaceId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          'relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border',
          'bg-surface shadow-xl',
          mode === 'ask' ? 'max-h-[min(80vh,720px)]' : '',
        )}
      >
        {teamspaceAskEnabled ? (
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={cn(
                'flex-1 px-4 py-2.5 text-xs tracking-dashboard transition-colors',
                mode === 'search'
                  ? 'bg-white/[0.03] font-medium text-text-emphasis'
                  : 'text-text-primary/45 hover:text-text-primary/70',
              )}
            >
              Search · {formatHotkeyLabel('mod+k')}
            </button>
            <button
              type="button"
              onClick={() => setMode('ask')}
              className={cn(
                'flex-1 px-4 py-2.5 text-xs tracking-dashboard transition-colors',
                mode === 'ask'
                  ? 'bg-white/[0.03] font-medium text-text-emphasis'
                  : 'text-text-primary/45 hover:text-text-primary/70',
              )}
            >
              Ask teamspace · {formatHotkeyLabel('mod+shift+k')}
            </button>
          </div>
        ) : null}

        {mode === 'ask' && teamspaceAskEnabled ? (
          <TeamspaceAskPanel
            spaceId={spaceId}
            compact
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <>
            <SearchInput value={query} onChange={setQuery} inputRef={inputRef} />

            <div className="scrollbar-none max-h-80 overflow-y-auto p-1">
              {query.trim().length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-text-primary/50">
                  Search notes, pages, and project tasks
                </p>
              ) : isFetching && results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-text-primary/50">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-text-primary/50">No results</p>
              ) : (
                results.map((result, index) => (
                  <SearchResultRow
                    key={`${isSearchPageResult(result) ? 'page' : 'task'}:${result.id}`}
                    result={result}
                    isActive={index === activeIndex}
                    onSelect={() => {
                      void navigateToSearchResult(navigate, spaceId, result).then(() => {
                        onOpenChange(false)
                      })
                    }}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
