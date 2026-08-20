import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Globe, Tag, Target } from 'lucide-react'
import { cn } from '@/lib/cn'

type ProjectBoardSettingsNavProps = {
  spaceId: string
  boardId: string
}

const navItems: Array<{
  to: '/s/$spaceId/projects/$boardId/settings/labels' | '/s/$spaceId/projects/$boardId/settings/milestones' | '/s/$spaceId/projects/$boardId/settings/public'
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    to: '/s/$spaceId/projects/$boardId/settings/labels',
    label: 'Labels',
    description: 'Task categories',
    icon: Tag,
  },
  {
    to: '/s/$spaceId/projects/$boardId/settings/milestones',
    label: 'Milestones',
    description: 'Releases and versions',
    icon: Target,
  },
  {
    to: '/s/$spaceId/projects/$boardId/settings/public',
    label: 'Public board',
    description: 'Share read-only link',
    icon: Globe,
  },
]

export function ProjectBoardSettingsNav({ spaceId, boardId }: ProjectBoardSettingsNavProps) {
  return (
    <nav className="sticky top-0 z-10 flex w-full shrink-0 flex-row gap-1 overflow-x-auto bg-surface pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:self-start lg:pb-4">
      {navItems.map(({ to, label, description, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          params={{ spaceId, boardId }}
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
