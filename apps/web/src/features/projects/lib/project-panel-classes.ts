import { cn } from '@/lib/cn'

export type ProjectPanelFieldVariant = 'field' | 'inline'

export const projectPanelFieldTrigger = cn(
  'flex w-full items-center justify-between gap-2 rounded-lg border border-border/50',
  'bg-white/[0.04] px-3 py-2 text-left text-sm text-text-emphasis transition-colors',
  'hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-80',
)

export const projectPanelInlineTrigger = cn(
  'group/panel-field inline-flex max-w-full items-center justify-end gap-1',
  'text-sm text-text-emphasis transition-opacity disabled:cursor-default disabled:opacity-80',
)

export const projectPanelInlineChevron = cn(
  'shrink-0 text-text-primary/35 opacity-0 transition-opacity',
  'group-hover/panel-field:opacity-100 group-data-[open=true]/panel-field:opacity-100',
)

export function projectPanelTriggerClass(
  variant: ProjectPanelFieldVariant,
  className?: string,
) {
  return cn(variant === 'inline' ? projectPanelInlineTrigger : projectPanelFieldTrigger, className)
}

export const projectPanelPopoverSurface = cn(
  'overflow-hidden rounded-lg border border-border/80 bg-sidebar shadow-lg shadow-black/45',
)

export function projectPanelOption(selected: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
    'text-text-primary/75 hover:bg-white/[0.04] hover:text-text-emphasis active:bg-white/[0.08]',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15',
    selected && 'bg-white/[0.05] text-text-emphasis',
  )
}
