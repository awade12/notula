import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ProjectTaskPropertyRowProps = {
  label: string
  children: ReactNode
  align?: 'center' | 'start'
  valueAlign?: 'start' | 'end'
  className?: string
}

export function ProjectTaskPropertyRow({
  label,
  children,
  align = 'center',
  valueAlign = 'end',
  className,
}: ProjectTaskPropertyRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[5.75rem_minmax(0,1fr)] gap-3 py-2.5',
        align === 'center' ? 'items-center' : 'items-start',
        className,
      )}
    >
      <span
        className={cn(
          'text-xs tracking-dashboard text-text-primary/45',
          align === 'start' && 'pt-0.5',
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          'min-w-0',
          valueAlign === 'end' ? 'flex justify-end' : 'w-full',
        )}
      >
        {children}
      </div>
    </div>
  )
}

type ProjectTaskPropertySectionProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function ProjectTaskPropertySection({
  title,
  children,
  className,
}: ProjectTaskPropertySectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      {title ? (
        <h3 className="px-0.5 text-[10px] font-medium uppercase tracking-wider text-text-primary/30">
          {title}
        </h3>
      ) : null}
      <div className="divide-y divide-border/35 rounded-lg border border-border/40 bg-white/[0.02] px-3">
        {children}
      </div>
    </section>
  )
}
