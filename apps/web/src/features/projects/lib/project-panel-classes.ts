import { cn } from '@/lib/cn'

export const projectPanelFieldTrigger = cn(
  'flex w-full items-center justify-between gap-2 rounded-lg border border-border/50',
  'bg-white/[0.04] px-3 py-2 text-left text-sm text-text-emphasis transition-colors',
  'hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-80',
)

export const projectPanelPopoverSurface = cn(
  'rounded-xl border border-white/10 bg-surface p-1 shadow-xl shadow-black/50',
)

export function projectPanelOption(selected: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    'text-text-primary/80 hover:bg-white/[0.1] hover:text-text-emphasis active:bg-white/[0.14]',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
    selected && 'bg-white/[0.06] text-text-emphasis',
  )
}
