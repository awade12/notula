import { Link } from '@tanstack/react-router'
import { AlertTriangle, CalendarDays, Copy, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { usePageAiInsights } from '@/features/ai/hooks/use-page-ai-insights'
import { mergeAiFeatureFlags } from '@/features/ai/lib/feature-flags'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { cn } from '@/lib/cn'

type PageAiInsightsBannerProps = {
  spaceId: string
  pageId: string
}

export function PageAiInsightsBanner({ spaceId, pageId }: PageAiInsightsBannerProps) {
  const { data: settings } = useAiSettings()
  const flags = mergeAiFeatureFlags(settings?.featureFlags)
  const { data: insights } = usePageAiInsights(spaceId, pageId)
  const [dismissed, setDismissed] = useState<string[]>([])

  if (!insights || !settings?.hasApiKey) return null

  const showStale =
    flags.stalePageDetector &&
    insights.stale?.isStale &&
    !dismissed.includes('stale')

  const showDuplicates =
    flags.duplicateDetection &&
    (insights.duplicates?.length ?? 0) > 0 &&
    !dismissed.includes('duplicates')

  const showMeetingPrep =
    flags.meetingPrep &&
    insights.meetingPrep &&
    (insights.meetingPrep.backlinks.length > 0 ||
      insights.meetingPrep.relatedPages.length > 0) &&
    !dismissed.includes('meeting-prep')

  if (!showStale && !showDuplicates && !showMeetingPrep) return null

  return (
    <div className="mb-4 space-y-2">
      {showStale && insights.stale ? (
        <InsightCard
          tone="warning"
          title="This page may be stale"
          onDismiss={() => setDismissed((items) => [...items, 'stale'])}
        >
          <p className="text-xs leading-relaxed text-text-primary/75">
            Last updated {insights.stale.daysSinceUpdate} days ago, but{' '}
            {insights.stale.backlinkCount} page
            {insights.stale.backlinkCount === 1 ? '' : 's'} link here. Consider refreshing the
            spec.
          </p>
        </InsightCard>
      ) : null}

      {showDuplicates && insights.duplicates ? (
        <InsightCard
          tone="info"
          title="You might be rewriting an existing note"
          icon={<Copy size={14} strokeWidth={1.75} aria-hidden />}
          onDismiss={() => setDismissed((items) => [...items, 'duplicates'])}
        >
          <ul className="space-y-1">
            {insights.duplicates.slice(0, 3).map((page) => (
              <li key={page.id}>
                <Link
                  to="/s/$spaceId/p/$pageId"
                  params={{ spaceId, pageId: page.id }}
                  className="inline-flex items-center gap-1.5 text-xs text-text-emphasis hover:underline"
                >
                  {page.icon ? <PageIconDisplay value={page.icon} size={14} /> : null}
                  {page.title}
                  <span className="text-text-primary/45">
                    {Math.round(page.score * 100)}% similar
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </InsightCard>
      ) : null}

      {showMeetingPrep && insights.meetingPrep ? (
        <InsightCard
          tone="neutral"
          title="Meeting prep"
          icon={<CalendarDays size={14} strokeWidth={1.75} aria-hidden />}
          onDismiss={() => setDismissed((items) => [...items, 'meeting-prep'])}
        >
          <div className="space-y-2 text-xs text-text-primary/75">
            {insights.meetingPrep.recentLinkedEdits.length > 0 ? (
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-text-primary/45">
                  Recently edited links
                </p>
                <ul className="space-y-1">
                  {insights.meetingPrep.recentLinkedEdits.slice(0, 4).map((page) => (
                    <li key={page.id}>
                      <Link
                        to="/s/$spaceId/p/$pageId"
                        params={{ spaceId, pageId: page.id }}
                        className="text-text-emphasis hover:underline"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {insights.meetingPrep.relatedPages.length > 0 ? (
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-text-primary/45">
                  Related pages
                </p>
                <ul className="space-y-1">
                  {insights.meetingPrep.relatedPages.map((page) => (
                    <li key={page.id}>
                      <Link
                        to="/s/$spaceId/p/$pageId"
                        params={{ spaceId, pageId: page.id }}
                        className="text-text-emphasis hover:underline"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </InsightCard>
      ) : null}
    </div>
  )
}

function InsightCard({
  title,
  children,
  tone,
  icon,
  onDismiss,
}: {
  title: string
  children: ReactNode
  tone: 'warning' | 'info' | 'neutral'
  icon?: ReactNode
  onDismiss: () => void
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border px-3 py-2.5 pr-9',
        tone === 'warning' && 'border-amber-500/25 bg-amber-500/[0.06]',
        tone === 'info' && 'border-sky-500/20 bg-sky-500/[0.05]',
        tone === 'neutral' && 'border-border bg-white/[0.03]',
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {tone === 'warning' ? (
          <AlertTriangle size={14} className="text-amber-400/90" aria-hidden />
        ) : (
          icon
        )}
        <p className="text-xs font-medium tracking-dashboard text-text-emphasis">{title}</p>
      </div>
      {children}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded p-1 text-text-primary/40 hover:bg-white/[0.06] hover:text-text-primary"
      >
        <X size={12} aria-hidden />
      </button>
    </div>
  )
}
