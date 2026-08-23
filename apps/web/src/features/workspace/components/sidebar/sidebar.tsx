import { useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { SpaceAiDigestCard } from '@/features/ai/components/space-ai-digest-card'
import { useTeamspaceAskHotkey } from '@/features/ai/hooks/use-teamspace-ask-hotkey'
import { useSpaceAiDigest } from '@/features/ai/hooks/use-space-ai-digest'
import { useSpaceAiDigestDismissed } from '@/features/ai/hooks/use-space-ai-digest-dismissed'
import { mergeAiFeatureFlags } from '@/features/ai/lib/feature-flags'
import { SearchDialog } from '@/features/search/components/search-dialog'
import { useSearchHotkey } from '@/features/search/hooks/use-search-hotkey'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
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
  const [searchMode, setSearchMode] = useState<'search' | 'ask'>('search')
  const { data: aiSettings } = useAiSettings()

  const teamspaceAskEnabled = mergeAiFeatureFlags(aiSettings?.featureFlags).teamspaceAsk
  const { data: digest } = useSpaceAiDigest(
    spaceId,
    Boolean(spaceId && aiSettings?.hasApiKey && teamspaceAskEnabled),
  )
  const { dismissed: digestDismissed, dismiss: dismissDigest } = useSpaceAiDigestDismissed(spaceId)

  const openSearch = useCallback(() => {
    if (spaceId) {
      setSearchMode('search')
      setSearchOpen(true)
    }
  }, [spaceId])

  const openAsk = useCallback(() => {
    if (spaceId && teamspaceAskEnabled) {
      setSearchMode('ask')
      setSearchOpen(true)
    }
  }, [spaceId, teamspaceAskEnabled])

  useSearchHotkey(openSearch)
  useTeamspaceAskHotkey(teamspaceAskEnabled, openAsk)

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

        {spaceId && digest && teamspaceAskEnabled && !digestDismissed ? (
          <SpaceAiDigestCard
            digest={digest}
            onAskTeamspace={openAsk}
            onDismiss={dismissDigest}
            className="mx-1 mb-1"
          />
        ) : null}

        <SidebarFooter />
      </aside>

      {spaceId ? (
        <SearchDialog
          spaceId={spaceId}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          teamspaceAskEnabled={teamspaceAskEnabled}
          initialMode={searchMode}
        />
      ) : null}
    </>
  )
}
