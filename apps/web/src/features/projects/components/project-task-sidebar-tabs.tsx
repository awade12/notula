import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { taskAiIcon } from '../lib/project-icon-pack'

export type ProjectTaskSidebarTab = 'properties' | 'ai' | 'activity'

type ProjectTaskSidebarTabsProps = {
  activeTab: ProjectTaskSidebarTab
  onChange: (tab: ProjectTaskSidebarTab) => void
}

const TABS: Array<{
  id: ProjectTaskSidebarTab
  label: string
  icon?: typeof taskAiIcon
}> = [
  { id: 'properties', label: 'Properties' },
  { id: 'ai', label: 'AI', icon: taskAiIcon },
  { id: 'activity', label: 'Activity' },
]

export function ProjectTaskSidebarTabs({ activeTab, onChange }: ProjectTaskSidebarTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Task panel sections"
      className="flex shrink-0 border-b border-border/50"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 pb-2.5 pt-2.5',
              'text-[11px] font-medium tracking-dashboard transition-[color,opacity] duration-150',
              isActive
                ? 'text-text-emphasis after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-text-emphasis/75'
                : 'text-text-primary/38 hover:text-text-primary/60',
            )}
          >
            {tab.icon ? (
              <WorkspaceIcon
                icon={tab.icon}
                size={iconSize.section}
                className={cn('shrink-0', isActive ? 'opacity-90' : 'opacity-45')}
              />
            ) : null}
            <span className="truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
