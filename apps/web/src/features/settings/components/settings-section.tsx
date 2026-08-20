import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SettingsSectionProps = {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-sidebar/40 p-5',
        className,
      )}
    >
      <div className="mb-5 border-b border-border pb-4">
        <h2 className="text-sm font-medium tracking-dashboard text-text-emphasis">{title}</h2>
        <p className="mt-1 text-meta tracking-dashboard text-text-primary">{description}</p>
      </div>
      {children}
    </section>
  )
}
