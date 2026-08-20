import {
  CheckCircle2,
  ExternalLink,
  GitCompareArrows,
  Radio,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Insight } from '../types'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

const kindConfig = {
  decision: { label: 'Decision', icon: CheckCircle2, color: 'text-blue-300' },
  signal: { label: 'Signal', icon: Radio, color: 'text-teal-300' },
} as const

function resolveInsightKindConfig(kind: string) {
  if (kind in kindConfig) {
    return kindConfig[kind as keyof typeof kindConfig]
  }
  return { label: 'Record', icon: Radio, color: 'text-text-primary/60' }
}

export function InsightRow({
  insight,
  showSpace = false,
  actions,
}: {
  insight: Insight
  showSpace?: boolean
  actions?: ReactNode
}) {
  const config = resolveInsightKindConfig(insight.kind)
  const Icon = config.icon

  return (
    <div
      className={cn(
        'group flex min-w-0 gap-3 rounded-lg border border-border bg-white/[0.018] px-3.5 py-3 transition-colors hover:border-white/12 hover:bg-white/[0.035]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5',
          config.color,
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <Link
        to="/s/$spaceId/p/$pageId"
        params={{ spaceId: insight.spaceId, pageId: insight.pageId }}
        className="min-w-0 flex-1"
      >
        <span className="flex flex-wrap items-center gap-2 text-[10px] font-medium tracking-[0.07em] text-text-primary/55 uppercase">
          {config.label}
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 normal-case tracking-normal text-text-primary/45">
            {insight.status}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-5 text-text-emphasis">
          {insight.content || `Untitled ${config.label.toLowerCase()}`}
        </span>
        <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-text-primary/55">
          {showSpace && insight.spaceName ? (
            <>
              <span>{insight.spaceName}</span>
              <span>·</span>
            </>
          ) : null}
          <span className="truncate">{insight.pageTitle}</span>
          {insight.owner ? (
            <>
              <span>·</span>
              <span className="truncate">
                {insight.ownerName || insight.owner}
              </span>
            </>
          ) : null}
        </span>
        {insight.source || insight.supersedes ? (
          <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-primary/40">
            {insight.source ? <span>Source: {insight.source}</span> : null}
            {insight.supersedes ? (
              <span>
                Supersedes: {insight.supersedesTitle || insight.supersedes}
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>
      <span className="flex shrink-0 items-start gap-1">
        {insight.supersedesPageId ? (
          <Link
            to="/s/$spaceId/p/$pageId"
            params={{
              spaceId: insight.spaceId,
              pageId: insight.supersedesPageId,
            }}
            className="flex size-7 items-center justify-center rounded-md text-text-primary/30 transition-colors hover:bg-white/7 hover:text-text-primary"
            aria-label="Open superseded decision"
            title={`Open: ${insight.supersedesTitle || 'superseded decision'}`}
          >
            <GitCompareArrows className="size-3.5" strokeWidth={1.75} />
          </Link>
        ) : null}
        {actions}
        <ExternalLink
          className="mt-1 size-3.5 shrink-0 text-text-primary/25 transition-colors group-hover:text-text-primary/60"
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
    </div>
  )
}
