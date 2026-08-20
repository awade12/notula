import { cn } from '@/lib/cn'

export const dbRowHeight = 'min-h-8'

export const dbCell = cn('flex w-full items-center px-2.5', dbRowHeight)

export const dbCellDisplay = cn(
  dbCell,
  'cursor-text rounded-sm transition-colors hover:bg-white/[0.04]',
)

export const dbCellEditing = cn(
  dbCell,
  'rounded-sm bg-white/[0.04] ring-1 ring-inset ring-white/12',
)

export const dbHeaderLabel = cn(
  'flex items-center gap-1.5 whitespace-nowrap px-2.5 text-xs font-medium text-text-primary/55',
  dbRowHeight,
)

export const dbHeaderLabelEditing = cn(
  dbHeaderLabel,
  'rounded-sm bg-white/[0.04] ring-1 ring-inset ring-white/12',
)

export const dbHeaderLabelButton = cn(
  dbHeaderLabel,
  'w-full border-0 bg-transparent p-0 text-left transition-colors hover:text-text-primary/70',
)

export const dbRowGutter = cn('relative flex items-center justify-center', dbRowHeight, 'w-full')

export const dbSelectPill =
  'inline-flex max-w-full items-center rounded px-2 py-0.5 text-meta whitespace-nowrap'

export const dbNewRow = cn(
  'flex w-full items-center gap-2 px-2.5 text-sm text-text-primary/40 transition-colors hover:text-text-primary/60',
  dbRowHeight,
)

export const dbPopover = cn(
  'absolute top-[calc(100%+0.375rem)] right-0 z-40',
  'w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/8 bg-surface-muted p-3.5 shadow-2xl',
)

export const dbAddPropertyPopover = cn(
  'absolute top-[calc(100%+0.375rem)] right-0 z-50 w-72',
  'rounded-lg border border-white/8 bg-surface-muted shadow-2xl',
)

export function dbViewTab(active: boolean) {
  return cn(
    'relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-meta transition-colors',
    active
      ? 'bg-white/[0.07] text-text-emphasis'
      : 'text-text-primary/55 hover:text-text-primary/90',
  )
}

export function dbToolbarBtn(active: boolean) {
  return cn(
    'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-meta text-text-primary/55 transition-colors',
    'hover:bg-white/[0.04] hover:text-text-primary/90',
    active && 'bg-white/[0.06] text-text-emphasis',
  )
}

export function dbAddColumnBtn(open: boolean) {
  return cn(
    'mx-auto flex size-7 items-center justify-center rounded-md text-text-primary/30 transition-colors',
    'hover:bg-white/[0.06] hover:text-text-primary/80',
    open && 'bg-white/[0.06] text-text-primary/80',
  )
}

export type TableColumnKind = 'gutter' | 'title' | 'field' | 'add'

export function getTableColumnClass(kind: TableColumnKind, layer: 'head' | 'body') {
  const head = layer === 'head'
  const body = layer === 'body'

  return cn(
    'p-0 align-middle',
    head && 'sticky top-0 z-[5] border-b border-white/8 bg-surface',
    body &&
      'border-b border-white/[0.06] bg-transparent transition-colors group-hover/row:bg-white/[0.028] group-focus-within/row:bg-white/[0.028]',
    kind === 'gutter' && 'sticky left-0 z-[4] w-8 min-w-8 max-w-8',
    kind === 'gutter' && head && 'z-[6]',
    kind === 'title' &&
      'sticky left-8 z-[3] min-w-64 w-64 shadow-[1px_0_0_0_rgb(255_255_255/0.04)]',
    kind === 'title' && head && 'z-[6]',
    kind === 'field' && 'min-w-40',
    kind === 'add' && 'w-10 min-w-10',
  )
}

export function resolveTableColumnKind(columnId: string): TableColumnKind {
  if (columnId === '_gutter') return 'gutter'
  if (columnId === '_add-column') return 'add'
  if (columnId === 'title') return 'title'
  return 'field'
}
