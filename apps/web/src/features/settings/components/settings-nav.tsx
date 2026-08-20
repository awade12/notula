import type { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/cn'

export type SettingsNavItem = {
  to:
    | '/settings/profile'
    | '/settings/security'
    | '/settings/appearance'
    | '/settings/editor'
    | '/settings/interface'
    | '/settings/ai'
    | '/settings/search'
    | '/settings/shortcuts'
    | '/settings/collaboration'
    | '/settings/links'
    | '/settings/privacy'
  label: string
  description: string
  icon: LucideIcon
}

type SettingsNavProps = {
  items: SettingsNavItem[]
}

export function SettingsNav({ items }: SettingsNavProps) {
  return (
    <nav className="sticky top-0 z-10 flex w-full shrink-0 flex-row gap-1 overflow-x-auto bg-surface pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:self-start lg:pb-4">
      {items.map(({ to, label, description, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'flex min-w-[9rem] items-start gap-2.5 rounded-lg px-2.5 py-2 lg:min-w-0',
            'text-xs tracking-dashboard transition-colors duration-100',
            'text-text-primary hover:bg-white/5 hover:text-text-emphasis',
          )}
          activeProps={{
            className: cn(
              'bg-white/8 font-medium text-text-emphasis shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]',
            ),
          }}
        >
          <Icon className="mt-0.5 size-4 shrink-0 text-text-primary" strokeWidth={1.75} />
          <span className="min-w-0">
            <span className="block">{label}</span>
            <span className="mt-0.5 block text-[10px] font-normal text-text-primary/70">
              {description}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
