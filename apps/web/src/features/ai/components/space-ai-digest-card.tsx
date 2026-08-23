import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SpaceAiDigest } from '../hooks/use-space-ai-digest'

type SpaceAiDigestCardProps = {
  digest: SpaceAiDigest
  onAskTeamspace?: () => void
  onDismiss?: () => void
  className?: string
}

export function SpaceAiDigestCard({
  digest,
  onAskTeamspace,
  onDismiss,
  className,
}: SpaceAiDigestCardProps) {
  const hasHighlights = digest.highlights.length > 0

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-white/[0.03] px-3 py-3',
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} strokeWidth={1.75} className="text-text-primary/50" aria-hidden />
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-primary/45">
            Teamspace digest
          </p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss teamspace digest"
            onClick={onDismiss}
            className="rounded-md p-1 text-text-primary/35 transition-colors hover:bg-white/[0.06] hover:text-text-primary/70"
          >
            <X size={13} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="text-[12px] leading-relaxed text-text-primary/70">{digest.summary}</p>

      {hasHighlights ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {digest.highlights.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-border/40 bg-white/[0.03] px-2 py-0.5 text-[10px] text-text-primary/55"
            >
              {item.count} {item.label.toLowerCase()}
            </span>
          ))}
        </div>
      ) : null}

      {onAskTeamspace ? (
        <button
          type="button"
          onClick={onAskTeamspace}
          className="mt-3 text-[11px] font-medium text-text-primary/55 transition-colors hover:text-text-emphasis"
        >
          Ask about this teamspace
        </button>
      ) : null}
    </div>
  )
}
