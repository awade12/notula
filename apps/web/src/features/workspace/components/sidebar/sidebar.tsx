import { useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { SearchDialog } from '@/features/search/components/search-dialog'
import { useSearchHotkey } from '@/features/search/hooks/use-search-hotkey'
import { warmCollabConfig } from '@/lib/collab-config-cache'
import { PageTree } from '@/features/workspace/components/page-tree/page-tree'
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar'
import { SidebarChrome } from '@/features/workspace/components/sidebar/sidebar-chrome'
import { SidebarFooter } from '@/features/workspace/components/sidebar/sidebar-footer'
import { SpacePicker } from '@/features/workspace/components/sidebar/space-picker'
import { useWorkspaceMode } from '@/features/workspace/hooks/use-workspace-mode'

export function Sidebar() {
  const params = useParams({ strict: false })
  const spaceId = 'spaceId' in params ? params.spaceId : undefined
  const workspaceMode = useWorkspaceMode()
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => {
    if (spaceId) setSearchOpen(true)
  }, [spaceId])

  useSearchHotkey(openSearch)

  useEffect(() => {
    warmCollabConfig()
  }, [])

  return (
    <>
      <aside className="flex h-full w-sidebar-width shrink-0 flex-col gap-3 overflow-hidden bg-sidebar px-2 py-3 text-text-inverse">
        <SidebarChrome spaceId={spaceId} onSearch={openSearch} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {spaceId ? (
            workspaceMode === 'projects' ? (
              <ProjectsSidebar spaceId={spaceId} />
            ) : (
              <PageTree spaceId={spaceId} />
            )
          ) : (
            <SpacePicker />
          )}
        </div>

        <SidebarFooter />
      </aside>

      {spaceId ? (
        <SearchDialog
          spaceId={spaceId}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      ) : null}
    </>
  )
}
