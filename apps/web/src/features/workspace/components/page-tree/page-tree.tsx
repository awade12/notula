import { SidebarBlock } from '@/features/workspace/components/sidebar/sidebar-block'
import { SidebarCreateMenu } from '@/features/workspace/components/sidebar/sidebar-create-menu'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { sidebarEmptyState, sidebarNewPageRow } from '@/features/workspace/lib/sidebar-classes'
import { pageAddIcon, favoriteIcon, recentIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchPage } from '@/features/editor/lib/prefetch-page'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { PageTreeNodeRow } from './page-tree-node-row'
import { PageTreeRootDropZone } from './page-tree-root-drop-zone'
import { usePageActions } from '../../hooks/use-page-actions'
import { useCanEditSpace } from '../../hooks/use-space-role'
import { useExpandedNodes } from '../../hooks/use-expanded-nodes'
import { useMovePage, prepareMoveMutation } from '../../hooks/use-move-page'
import { usePendingPageId } from '../../hooks/use-pending-page-id'
import { usePageTree } from '../../hooks/use-page-tree'
import { useSidebarPagePreferences } from '../../hooks/use-sidebar-page-preferences'
import { setPendingPageId } from '../../stores/pending-page-id'
import { findPageAncestorIds } from '../../lib/find-page-ancestors'
import type { PageTreeNode } from '../../lib/build-tree'
import { type ActiveDropTarget } from '../../lib/drop-target'
import { PageShortcutSection } from './page-shortcut-section'
import { useNewPageHotkey } from '@/features/settings/hooks/use-global-shortcuts'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'

type PageTreeProps = {
  spaceId: string
}

type ActiveDrop = ActiveDropTarget

export function PageTree({ spaceId }: PageTreeProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams({ strict: false })
  const activePageId = 'pageId' in params ? params.pageId : undefined
  const pendingPageId = usePendingPageId()
  const { data: tree, isLoading } = usePageTree(spaceId)
  const {
    favoriteIds,
    recentIds,
    recentExpanded,
    favoritesExpanded,
    isLoaded: preferencesLoaded,
    toggleFavorite,
    recordRecent,
    prunePageIds,
    toggleRecentExpanded,
    toggleFavoritesExpanded,
  } = useSidebarPagePreferences(spaceId)
  const movePage = useMovePage(spaceId)
  const { createPage } = usePageActions(spaceId)
  const canEdit = useCanEditSpace(spaceId)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [activeDrop, setActiveDrop] = useState<ActiveDrop | null>(null)
  const [rootDropActive, setRootDropActive] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)
  const flatPages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])
  const pagesById = useMemo(
    () => new Map(flatPages.map((page) => [page.id, page])),
    [flatPages],
  )
  const {
    showFavoritesSection,
    showRecentSection,
    recentPageLimit,
  } = useUserPreferences()
  const favoritePages = favoriteIds
    .map((id) => pagesById.get(id))
    .filter((page) => page !== undefined)
  const recentPages = recentIds
    .map((id) => pagesById.get(id))
    .filter((page) => page !== undefined)
    .slice(0, recentPageLimit)

  const ancestorIds = useMemo(
    () => (tree && activePageId ? findPageAncestorIds(tree, activePageId) : []),
    [tree, activePageId],
  )

  const { isExpanded, toggle, expand } = useExpandedNodes(ancestorIds)

  useEffect(() => {
    if (activePageId && pendingPageId === activePageId) {
      setPendingPageId(null)
    }
  }, [activePageId, pendingPageId])

  useEffect(() => {
    if (activePageId && preferencesLoaded && pagesById.has(activePageId)) {
      recordRecent(activePageId)
    }
  }, [activePageId, pagesById, preferencesLoaded, recordRecent])

  useEffect(() => {
    if (preferencesLoaded && tree) {
      prunePageIds(new Set(pagesById.keys()))
    }
  }, [pagesById, preferencesLoaded, prunePageIds, tree])

  useEffect(() => {
    if (!activeDrop || activeDrop.placement !== 'inside' || activeDrop.invalid) return

    const timer = window.setTimeout(() => {
      expand(activeDrop.targetId)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [activeDrop, expand])

  function openPage(pageId: string) {
    if (pageId === activePageId) return
    setPendingPageId(pageId)
    prefetchPage(queryClient, spaceId, pageId)
    void navigate({
      to: '/s/$spaceId/p/$pageId',
      params: { spaceId, pageId },
    })
  }

  async function createPageItem(kind: 'note' | 'folder', parentId?: string | null) {
    try {
      const page = await createPage.mutateAsync({
        title: kind === 'folder' ? 'New folder' : 'Untitled',
        parentId: parentId ?? null,
        kind,
      })

      if (parentId) expand(parentId)

      if (kind === 'folder') return

      setPendingPageId(page.id)
      prefetchPage(queryClient, spaceId, page.id)
      void navigate({
        to: '/s/$spaceId/p/$pageId',
        params: { spaceId, pageId: page.id },
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create page')
    }
  }

  const handleNewPageHotkey = useCallback(() => {
    if (!canEdit) return
    void createPageItem('note')
  }, [canEdit, createPageItem])

  useNewPageHotkey(handleNewPageHotkey)

  const handleDrop = useCallback(
    (target: PageTreeNode, placement: ActiveDrop['placement']) => {
      if (!canEdit || !draggedId) return

      const input = prepareMoveMutation(
        spaceId,
        queryClient,
        draggedId,
        target,
        placement,
      )

      setDraggedId(null)
      setActiveDrop(null)
      setRootDropActive(false)

      if (!input) return

      movePage.mutate(input, {
        onSuccess: () => {
          if (placement === 'inside') expand(target.id)
          setMoveError(null)
        },
        onError: (error) => {
          setMoveError(error instanceof Error ? error.message : 'Could not move page')
        },
      })
    },
    [canEdit, draggedId, expand, movePage, queryClient, spaceId],
  )

  function handleRootDrop() {
    if (!canEdit || !draggedId || !tree?.length) return
    const lastRoot = tree[tree.length - 1]
    if (!lastRoot || lastRoot.id === draggedId) return
    handleDrop(lastRoot, 'after')
  }

  return (
    <div className="scrollbar-none -mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
      {showFavoritesSection && favoritePages.length > 0 ? (
        <PageShortcutSection
          label="Favorites"
          icon={favoriteIcon}
          pages={favoritePages}
          activePageId={activePageId}
          onOpen={openPage}
          onHover={(pageId) => prefetchPage(queryClient, spaceId, pageId)}
          scrollable
          collapsible
          expanded={favoritesExpanded}
          onToggleExpanded={toggleFavoritesExpanded}
        />
      ) : null}

      {showRecentSection && preferencesLoaded && (recentPages.length > 0 || recentExpanded) ? (
        <PageShortcutSection
          label="Recent"
          icon={recentIcon}
          pages={recentPages}
          activePageId={activePageId}
          onOpen={openPage}
          onHover={(pageId) => prefetchPage(queryClient, spaceId, pageId)}
          collapsible
          expanded={recentExpanded}
          onToggleExpanded={toggleRecentExpanded}
          emptyHint="No recent pages"
        />
      ) : null}

      <SidebarBlock
        label="Private"
        sticky
        action={
          canEdit ? (
            <SidebarCreateMenu
              onCreateFolder={() => void createPageItem('folder')}
              onCreatePage={() => void createPageItem('note')}
            />
          ) : undefined
        }
        className="pb-1"
      >
        {canEdit ? (
          <button
            type="button"
            onClick={() => void createPageItem('note')}
            className={sidebarNewPageRow()}
          >
            <SidebarIcon icon={pageAddIcon} strokeWidth={1.75} />
            New page
          </button>
        ) : null}

        {moveError ? (
          <div className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-red-500/10 px-2.5 py-2">
            <p className="text-xs leading-relaxed text-red-300">{moveError}</p>
            <button
              type="button"
              onClick={() => setMoveError(null)}
              className="shrink-0 text-xs text-red-300/80 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-1 py-1">
            <div className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="ml-4 h-9 w-4/5 animate-pulse rounded-lg bg-white/[0.04]" />
          </div>
        ) : tree && tree.length > 0 ? (
          <ul className="space-y-0.5 pb-2" aria-label="Private pages">
            {tree.map((node) => (
              <PageTreeNodeRow
                key={node.id}
                node={node}
                spaceId={spaceId}
                depth={0}
                flatPages={flatPages}
                activePageId={activePageId}
                pendingPageId={pendingPageId}
                draggedId={draggedId}
                activeDrop={activeDrop}
                favoriteIds={favoriteIds}
                isExpanded={isExpanded}
                onToggle={toggle}
                onExpand={expand}
                canEdit={canEdit}
                onDragStart={setDraggedId}
                onDragEnd={() => {
                  setDraggedId(null)
                  setActiveDrop(null)
                  setRootDropActive(false)
                }}
                onDropTargetChange={(drop) => {
                  setRootDropActive(false)
                  setActiveDrop(drop)
                }}
                onDrop={handleDrop}
                onToggleFavorite={toggleFavorite}
              />
            ))}
            <PageTreeRootDropZone
              active={Boolean(draggedId)}
              placement={rootDropActive ? 'inside' : null}
              onDragOver={() => {
                setActiveDrop(null)
                setRootDropActive(true)
              }}
              onDragLeave={() => setRootDropActive(false)}
              onDrop={handleRootDrop}
            />
          </ul>
        ) : (
          <div className={sidebarEmptyState()}>
            <p className="text-xs tracking-dashboard text-text-inverse/45">No pages yet</p>
          </div>
        )}
      </SidebarBlock>
    </div>
  )
}
