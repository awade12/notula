import { cn } from '@/lib/cn'
import { isSearchTaskResult, type SearchResult } from '../hooks/use-search'

type SearchResultRowProps = {
  result: SearchResult
  isActive: boolean
  onSelect: () => void
}

function matchTypeLabel(matchType: SearchResult['matchType']) {
  if (matchType === 'title') return 'Title'
  if (matchType === 'semantic') return 'Semantic'
  return 'Content'
}

export function SearchResultRow({ result, isActive, onSelect }: SearchResultRowProps) {
  const isTask = isSearchTaskResult(result)

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
          {isTask ? 'Task' : matchTypeLabel(result.matchType)}
        </span>
      </div>
      {isTask ? (
        <span className="truncate text-[11px] text-text-primary/45">{result.boardTitle}</span>
      ) : null}
      {result.snippet ? (
        <span className="line-clamp-2 text-xs text-text-primary/60">{result.snippet}</span>
      ) : null}
    </button>
  )
}
