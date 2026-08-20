import { cn } from '@/lib/cn'

export function sidebarMotionHover(className?: string) {
  return cn(
    'transition-[color,background-color,box-shadow,opacity,transform,padding] duration-sidebar-hover ease-sidebar-hover',
    className,
  )
}

export function sidebarMotionExpand(className?: string) {
  return cn(
    'transition-[grid-template-rows,opacity] duration-sidebar-expand ease-sidebar-expand',
    className,
  )
}

export function sidebarMotionChevron(className?: string) {
  return cn(
    'transition-transform duration-sidebar-expand ease-sidebar-expand',
    className,
  )
}

export function sidebarRowActionReveal(className?: string) {
  return cn(
    'pointer-events-none translate-x-0.5 opacity-0',
    sidebarMotionHover(),
    'group-hover/row:pointer-events-auto group-hover/row:translate-x-0 group-hover/row:opacity-100',
    'group-focus-within/row:pointer-events-auto group-focus-within/row:translate-x-0 group-focus-within/row:opacity-100',
    'focus-within:pointer-events-auto focus-within:translate-x-0 focus-within:opacity-100',
    className,
  )
}

export function sidebarRowActionButton(className?: string) {
  return cn(
    'flex size-7 shrink-0 items-center justify-center rounded-lg text-text-inverse/40',
    sidebarMotionHover(),
    'hover:bg-white/[0.08] hover:text-text-inverse/85',
    className,
  )
}

export function sidebarRowActionsRail(isPinned: boolean, className?: string) {
  return cn(
    'absolute right-0.5 top-1/2 z-20 flex -translate-y-[calc(50%-1px)] items-center gap-0.5',
    sidebarRowActionReveal(),
    'has-[button[aria-expanded=true]]:pointer-events-auto has-[button[aria-expanded=true]]:translate-x-0 has-[button[aria-expanded=true]]:opacity-100',
    isPinned && 'pointer-events-auto translate-x-0 opacity-100',
    className,
  )
}

export function sidebarRowContentPad(hasActions: boolean) {
  return hasActions ? 'pr-10' : undefined
}

export function sidebarChromeStack(className?: string) {
  return cn('flex shrink-0 flex-col gap-2 px-0.5 pb-0.5', className)
}

export function sidebarModeTabs(className?: string) {
  return cn('flex gap-0.5 border-b border-border/60', className)
}

export function sidebarModeTab(active: boolean) {
  return cn(
    'relative -mb-px flex flex-1 items-center justify-center gap-1.5 px-2 pb-2 pt-1 text-xs font-medium tracking-dashboard',
    sidebarMotionHover(),
    active
      ? 'text-text-inverse after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-text-inverse/55'
      : 'text-text-inverse/40 hover:text-text-inverse/65',
  )
}

export function sidebarSectionHeading(active = false) {
  return cn(
    'min-w-0 flex-1 truncate text-xs font-medium tracking-dashboard',
    active ? 'text-text-inverse/70' : 'text-text-inverse/50',
  )
}

export function sidebarSectionIconTile() {
  return 'flex size-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-text-inverse/45'
}

export function sidebarSectionToggleButton(expanded: boolean) {
  return cn(
    'flex min-h-9 w-full min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-left',
    sidebarMotionHover(),
    'hover:bg-white/[0.04] hover:text-text-inverse/70',
    expanded && 'text-text-inverse/60',
  )
}

export function sidebarSectionHeaderRow(sticky = false) {
  return cn(
    sticky ? sidebarStickyHeader() : 'mb-1 flex min-h-9 items-center justify-between gap-2 px-0.5',
  )
}

export function sidebarSectionStaticHeader() {
  return 'flex min-h-9 w-full min-w-0 items-center gap-1.5 px-1.5'
}

export function sidebarSectionActionButton() {
  return cn(
    'flex size-8 shrink-0 items-center justify-center rounded-lg text-text-inverse/40',
    sidebarMotionHover(),
    'hover:bg-white/[0.08] hover:text-text-inverse/85',
  )
}

export function sidebarSearchField(disabled: boolean) {
  return cn(
    'flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-transparent px-2.5 text-left text-xs tracking-dashboard',
    sidebarMotionHover(),
    disabled
      ? 'cursor-not-allowed text-text-inverse/25'
      : 'bg-white/[0.03] text-text-inverse/45 hover:border-border/60 hover:bg-white/[0.05] hover:text-text-inverse/65',
  )
}

export function sidebarRow(active: boolean) {
  return cn(
    'flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-lg px-2 text-xs tracking-dashboard',
    sidebarMotionHover(),
    active
      ? 'bg-white/[0.1] font-medium text-text-inverse shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
      : 'text-text-inverse/65 hover:bg-white/[0.05] hover:text-text-inverse',
  )
}

export function sidebarNewPageRow() {
  return cn(
    'mb-1 flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 text-xs tracking-dashboard',
    sidebarMotionHover(),
    'text-text-inverse/40 hover:bg-white/[0.05] hover:text-text-inverse/70',
  )
}

export function sidebarTreeRowLeadingSlot(className?: string) {
  return cn('flex size-4.5 shrink-0 items-center justify-center', className)
}

export function sidebarTreeRowContentCluster(className?: string) {
  return cn('flex min-w-0 flex-1 items-center gap-2', className)
}

export function sidebarTreeRowSurface(active: boolean, interactive: boolean) {
  return cn(
    'relative flex h-9 min-w-0 flex-1 items-center rounded-lg px-2',
    sidebarMotionHover(),
    interactive && !active && 'hover:bg-white/[0.05]',
    active &&
      'bg-white/[0.1] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  )
}

export function sidebarEmptyState() {
  return 'rounded-lg border border-dashed border-border/80 px-3 py-5 text-center'
}

export function sidebarCollapsiblePanel(expanded: boolean) {
  return cn(
    sidebarMotionExpand(),
    'grid overflow-hidden',
    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
  )
}

export function sidebarCollapsiblePanelInner(expanded: boolean) {
  return cn('min-h-0 overflow-hidden', !expanded && 'pointer-events-none')
}

export function sidebarTreeExpandPanel(expanded: boolean) {
  return cn(
    sidebarMotionExpand(),
    'grid overflow-hidden',
    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
  )
}

export function sidebarChevronRotate(expanded: boolean) {
  return cn(sidebarMotionChevron(), 'shrink-0 text-text-inverse/35', expanded && 'rotate-90')
}

export function sidebarStickyHeader() {
  return 'sticky top-0 z-10 -mx-0.5 flex min-h-8 items-center justify-between gap-2 bg-sidebar px-0.5 py-1'
}

export function sidebarMenuSurface() {
  return cn(sidebarMenuDropdown(), 'left-0 right-0')
}

export function sidebarMenuDropdown(className?: string) {
  return cn(
    'absolute top-full z-50 mt-1 min-w-36 origin-top rounded-lg border border-border',
    'bg-sidebar p-1 shadow-lg shadow-black/40 animate-sidebar-menu-in',
    className,
  )
}

export function sidebarDivider() {
  return 'h-px shrink-0 bg-border'
}

export function sidebarKbd() {
  return 'ml-auto text-meta text-text-inverse/30'
}

export function sidebarWorkspaceRow(active: boolean) {
  return cn(
    'flex min-h-9 w-full items-center gap-2 rounded-lg px-1 text-left text-xs tracking-dashboard',
    sidebarMotionHover(),
    active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]',
  )
}
