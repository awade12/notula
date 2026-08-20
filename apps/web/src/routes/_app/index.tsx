import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { InsightRow } from '@/features/insights/components/insight-row'
import { useTodayInsights } from '@/features/insights/hooks/use-insights'

export const Route = createFileRoute('/_app/')({
  component: HomePage,
})

const appRoute = getRouteApi('/_app')

function HomePage() {
  const { user } = appRoute.useRouteContext()
  const { data, isLoading } = useTodayInsights()
  const recentDecisions = data?.recentDecisions ?? []

  return (
    <div className="mx-auto w-full max-w-4xl px-2 pb-16 pt-6">
      <div className="mb-8">
        <p className="mb-2 flex items-center gap-2 text-xs text-text-primary/60">
          <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden />
          Today
        </p>
        <h1 className="text-2xl font-medium tracking-dashboard text-text-emphasis">
          Welcome back, {user.name}.
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-primary">
          Recent decisions from across your teamspaces show up here.
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-white/[0.025]" />
      ) : (
        <TodaySection
          title="Recent decisions"
          count={recentDecisions.length}
        >
          {recentDecisions.slice(0, 8).map((insight) => (
            <InsightRow key={insight.id} insight={insight} showSpace />
          ))}
          {recentDecisions.length === 0 ? (
            <EmptyTodayState text="Use /decision in a note to start a shared decision record." />
          ) : null}
        </TodaySection>
      )}
    </div>
  )
}

function TodaySection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="text-xs font-medium text-text-emphasis">{title}</h2>
        <span className="text-[11px] tabular-nums text-text-primary/45">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function EmptyTodayState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-7 text-center">
      <p className="text-xs leading-5 text-text-primary/55">{text}</p>
    </div>
  )
}
