import { cn } from '@/lib/cn'

type ProjectKanbanInsertSlotProps = {
  active?: boolean
}

export function ProjectKanbanInsertSlot({ active = false }: ProjectKanbanInsertSlotProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none h-1 shrink-0 rounded-full bg-white/20 transition-opacity duration-100 ease-out',
        active ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

type ProjectKanbanEmptyDropZoneProps = {
  active?: boolean
}

export function ProjectKanbanEmptyDropZone({ active = false }: ProjectKanbanEmptyDropZoneProps) {
  return (
    <div
      className={cn(
        'flex min-h-20 items-center justify-center rounded-md border border-dashed px-3 text-center text-xs transition-colors duration-100',
        active
          ? 'border-white/16 text-text-primary/45'
          : 'border-border/35 text-text-primary/25',
      )}
    >
      Drop here
    </div>
  )
}
