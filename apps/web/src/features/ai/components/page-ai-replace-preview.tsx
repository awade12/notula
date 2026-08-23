import { useMemo, useState } from 'react'
import {
  buildPageAiLineDiff,
  collapsePageAiDiff,
  summarizePageAiDiff,
} from '@/features/ai/lib/build-page-ai-diff'
import { cn } from '@/lib/cn'

type PageAiReplacePreviewProps = {
  before: string
  after: string
  applyLabel: string
  onConfirm: () => void
}

export function PageAiReplacePreview({
  before,
  after,
  applyLabel,
  onConfirm,
}: PageAiReplacePreviewProps) {
  const [expanded, setExpanded] = useState(false)

  const diff = useMemo(() => buildPageAiLineDiff(before, after), [after, before])
  const summary = useMemo(() => summarizePageAiDiff(diff), [diff])
  const visibleDiff = useMemo(
    () => (expanded ? diff : collapsePageAiDiff(diff)),
    [diff, expanded],
  )

  const hasChanges = summary.added > 0 || summary.removed > 0

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/30">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium tracking-wide text-text-primary/45">
            Preview changes
          </p>
          <p className="text-[11px] text-text-primary/40">
            {hasChanges
              ? `${summary.added} added · ${summary.removed} removed`
              : 'No line-level changes detected'}
          </p>
        </div>
        {diff.length > visibleDiff.length ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-[11px] text-text-primary/55 transition-colors hover:text-text-emphasis"
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        ) : null}
      </div>

      <div className="max-h-48 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {visibleDiff.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className={cn(
              'whitespace-pre-wrap rounded px-1.5 py-0.5',
              line.type === 'add' && 'bg-green-400/10 text-green-200/85',
              line.type === 'remove' && 'bg-red-400/10 text-red-200/80 line-through',
              line.type === 'same' && 'text-text-primary/35',
            )}
          >
            {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
            {line.text || ' '}
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            'bg-text-emphasis text-sidebar hover:opacity-90',
          )}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  )
}
