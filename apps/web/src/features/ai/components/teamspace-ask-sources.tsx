import { Link } from '@tanstack/react-router'
import { FileText, ListTodo } from 'lucide-react'
import type { AiWorkspaceCitation } from '@/features/ai/lib/teamspace-ask-page'
import { cn } from '@/lib/cn'

type TeamspaceAskSourcesProps = {
  spaceId: string
  citations: AiWorkspaceCitation[]
  className?: string
}

export function TeamspaceAskSources({ spaceId, citations, className }: TeamspaceAskSourcesProps) {
  if (citations.length === 0) return null

  return (
    <div className={cn('mt-3 border-t border-border/60 pt-2', className)}>
      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-text-primary/40">Sources</p>
      <div className="flex flex-wrap gap-1.5">
      {citations.map((citation) => {
        const key = `${citation.type}:${citation.id}`
        const label =
          citation.type === 'task'
            ? `${citation.title} · ${citation.boardTitle}`
            : citation.title

        if (citation.type === 'note') {
          return (
            <Link
              key={key}
              to="/s/$spaceId/p/$pageId"
              params={{ spaceId, pageId: citation.id }}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-full border border-border',
                'bg-sidebar/40 px-2 py-0.5 text-[11px] text-text-primary/70 hover:bg-sidebar hover:text-text-primary',
              )}
            >
              <FileText size={11} className="shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={key}
            to="/s/$spaceId/projects/$boardId"
            params={{ spaceId, boardId: citation.boardId }}
            search={{ task: citation.id }}
            className={cn(
              'inline-flex max-w-full items-center gap-1 rounded-full border border-border',
              'bg-sidebar/40 px-2 py-0.5 text-[11px] text-text-primary/70 hover:bg-sidebar hover:text-text-primary',
            )}
          >
            <ListTodo size={11} className="shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
      </div>
    </div>
  )
}
