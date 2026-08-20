import { cn } from '@/lib/cn'

type DropIndicatorProps = {
  placement: 'before' | 'after' | 'inside'
  invalid?: boolean
}

export function DropIndicator({ placement, invalid = false }: DropIndicatorProps) {
  if (placement === 'inside') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 inset-y-0 rounded-lg',
          'z-20 border bg-transparent',
          invalid
            ? 'border-red-400/50 bg-red-500/10'
            : 'border-sky-400/70 bg-sky-400/10 shadow-[inset_0_0_0_1px_rgb(56_189_248/0.15)]',
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0.5 right-0.5 z-20 h-0.5 rounded-full',
        'before:absolute before:-left-1 before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full',
        invalid ? 'bg-red-400/80 before:bg-red-400' : 'bg-sky-400 before:bg-sky-400',
        placement === 'before' ? '-top-0.5' : '-bottom-0.5',
      )}
    />
  )
}
