import { SidebarCollapseButton } from '@/features/workspace/components/sidebar/sidebar-collapse-button'
import { WorkspaceModeSwitcher } from '@/features/workspace/components/workspace-mode-switcher'
import { useWorkspaceMode } from '@/features/workspace/hooks/use-workspace-mode'
import { SidebarSearchTrigger } from '@/features/workspace/components/sidebar/sidebar-search-trigger'
import { SpaceSwitcher } from '@/features/workspace/components/sidebar/space-switcher'
import { sidebarChromeStack } from '@/features/workspace/lib/sidebar-classes'

type SidebarChromeProps = {
  spaceId?: string
  onSearch: () => void
}

export function SidebarChrome({ spaceId, onSearch }: SidebarChromeProps) {
  const workspaceMode = useWorkspaceMode()

  return (
    <div className={sidebarChromeStack()}>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <SpaceSwitcher />
        </div>
        <SidebarCollapseButton />
      </div>

      {spaceId ? <WorkspaceModeSwitcher /> : null}

      <SidebarSearchTrigger
        disabled={!spaceId}
        placeholder={
          !spaceId
            ? 'Search'
            : workspaceMode === 'projects'
              ? 'Search (Notes mode)…'
              : 'Search pages…'
        }
        onClick={onSearch}
      />
    </div>
  )
}
