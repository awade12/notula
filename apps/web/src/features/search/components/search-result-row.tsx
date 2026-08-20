import { cn } from '@/lib/cn'
import type { SearchResult } from '../hooks/use-search'

type SearchResultRowProps = {
  result: SearchResult
  isActive: boolean
  onSelect: () => void
}

export function SearchResultRow({ result, isActive, onSelect }: SearchResultRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left',
        isActive ? 'bg-sidebar/15' : 'hover:bg-sidebar/10',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-text-primary">{result.title}</span>
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-primary/50">
          {result.matchType === 'title'
            ? 'Title'
            : result.matchType === 'semantic'
              ? 'Semantic'
              : 'Content'}
        </span>
      </div>
      {result.snippet ? (
        <span className="line-clamp-2 text-xs text-text-primary/60">{result.snippet}</span>
      ) : null}
    </button>
  )
}
