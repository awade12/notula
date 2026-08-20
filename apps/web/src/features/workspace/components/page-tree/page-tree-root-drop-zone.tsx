import { cn } from '@/lib/cn'
import type { DropPlacement } from '../../lib/drop-target'

type PageTreeRootDropZoneProps = {
  active: boolean
  placement: DropPlacement | null
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
}

export function PageTreeRootDropZone({
  active,
  placement,
  onDragOver,
  onDragLeave,
  onDrop,
}: PageTreeRootDropZoneProps) {
  if (!active) return null

  return (
    <li
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault()
        onDrop()
      }}
      className="list-none py-1"
    >
          <div
            className={cn(
              'mx-0.5 flex h-8 items-center justify-center rounded-lg border border-dashed transition-colors',
          placement === 'inside'
            ? 'border-sky-400/60 bg-sky-400/10 text-sky-300/80'
            : 'border-white/10 text-text-inverse/30',
        )}
      >
        <span className="text-[11px] tracking-dashboard">Drop here for top level</span>
      </div>
    </li>
  )
}
