import { useAppearancePreferences } from '@/features/settings/hooks/use-appearance'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type DragEvent } from 'react'
import { prefetchPage } from '@/features/editor/lib/prefetch-page'
import { shouldConfirmDelete } from '@/features/settings/lib/confirm-action'
import { cn } from '@/lib/cn'
import { SidebarCollapsiblePanel } from '../sidebar/sidebar-collapsible-panel'
import { SidebarTreeRow } from '../sidebar/sidebar-tree-row'
import { usePageActions } from '../../hooks/use-page-actions'
import { collectDescendantIdsFromTree } from '../../lib/update-page-tree-cache'
import { setPendingPageId } from '../../stores/pending-page-id'
import type { FlatPage, PageTreeNode } from '../../lib/build-tree'
import { isFolderKind } from '../../types/page-kind'
import {
  resolveDropPlacementWithHysteresis,
  type ActiveDropTarget,
  type DropPlacement,
} from '../../lib/drop-target'
import { canMovePage } from '../../lib/page-tree-move'
import { DropIndicator } from './drop-indicator'
import { PageTreeRowFrame } from './page-tree-row-frame'
import { PageIconPicker } from '../page-icon-picker'
import { usePageTreeRowMenu } from './page-tree-row-menu'
import { PageTreeNodeIcon } from './page-tree-node-icon'
import { PageTreeRowRenameInput } from './page-tree-row-rename-input'

type ActiveDrop = ActiveDropTarget

type PageTreeNodeRowProps = {
  node: PageTreeNode
  spaceId: string
  depth: number
  flatPages: FlatPage[]
  activePageId?: string
  pendingPageId: string | null
  draggedId: string | null
  activeDrop: ActiveDrop | null
  favoriteIds: string[]
  isExpanded: (id: string) => boolean
  onToggle: (id: string) => void
  onExpand: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDropTargetChange: (drop: ActiveDrop | null) => void
  onDrop: (target: PageTreeNode, placement: DropPlacement) => void
  onToggleFavorite: (pageId: string) => void
  canEdit?: boolean
}

export function PageTreeNodeRow({
  node,
  spaceId,
  depth,
  flatPages,
  activePageId,
  pendingPageId,
  draggedId,
  activeDrop,
  favoriteIds,
  isExpanded,
  onToggle,
  onExpand,
  onDragStart,
  onDragEnd,
  onDropTargetChange,
  onDrop,
  onToggleFavorite,
  canEdit = true,
}: PageTreeNodeRowProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showPageIcons } = useAppearancePreferences()
  const { rename, remove, createSubPage, updateIcon, convertKind } = usePageActions(spaceId)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(node.title)
  const hasChildren = node.children.length > 0
  const isFolder = isFolderKind(node.kind)
  const showsChildren = hasChildren || isFolder
  const expanded = isExpanded(node.id)
  const isActive = pendingPageId ? pendingPageId === node.id : activePageId === node.id
  const isDragging = draggedId === node.id
  const isDropTarget = activeDrop?.targetId === node.id

  function activatePage() {
    if (isEditing) return
    if (isActive) return

    setPendingPageId(node.id)
    prefetchPage(queryClient, spaceId, node.id)

    void navigate({
      to: '/s/$spaceId/p/$pageId',
      params: { spaceId, pageId: node.id },
    })
  }

  async function commitRename() {
    const nextTitle = editTitle.trim() || (isFolder ? 'New folder' : 'Untitled')
    setIsEditing(false)
    if (nextTitle === node.title) return
    await rename.mutateAsync({ pageId: node.id, title: nextTitle })
  }

  function cancelRename() {
    setEditTitle(node.title)
    setIsEditing(false)
  }

  function handleDelete() {
    const confirmed = shouldConfirmDelete(`Delete "${node.title}" and its sub-pages?`)
    if (!confirmed) return

    const tree = queryClient.getQueryData<PageTreeNode[]>(['pages', spaceId])
    const deletedIds = tree ? collectDescendantIdsFromTree(tree, node.id) : [node.id]
    const shouldLeavePage = Boolean(activePageId && deletedIds.includes(activePageId))

    if (shouldLeavePage) {
      void navigate({ to: '/s/$spaceId', params: { spaceId } })
    }

    remove.mutate(node.id, {
      onError: (error) => {
        window.alert(error instanceof Error ? error.message : 'Could not delete page')
      },
    })
  }

  async function handleAddSubPage() {
    if (!isFolder) return

    onExpand(node.id)
    try {
      const page = await createSubPage.mutateAsync({ parentId: node.id, kind: 'note' })
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

  async function handleAddSubFolder() {
    if (!isFolder) return

    onExpand(node.id)
    try {
      await createSubPage.mutateAsync({
        parentId: node.id,
        kind: 'folder',
        title: 'New folder',
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create folder')
    }
  }

  async function handleConvert(kind: 'note' | 'folder') {
    if (kind === 'note' && hasChildren) {
      window.alert('Move or delete items before converting to a note.')
      return
    }

    await convertKind.mutateAsync({ pageId: node.id, kind })
    if (isActive) {
      await navigate({
        to: '/s/$spaceId/p/$pageId',
        params: { spaceId, pageId: node.id },
      })
    }
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', node.id)
    onDragStart(node.id)
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>) {
    if (!draggedId || draggedId === node.id) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const row = event.currentTarget.querySelector('[data-tree-row]') as HTMLElement | null
    if (!row) return

    const rect = row.getBoundingClientRect()
    const previous =
      activeDrop?.targetId === node.id ? activeDrop.placement : null
    const placement = resolveDropPlacementWithHysteresis(
      event.clientY,
      rect.top,
      rect.height,
      previous,
      { allowInside: isFolder },
    )
    const invalid = !canMovePage(flatPages, draggedId, node, placement)
    onDropTargetChange({ targetId: node.id, placement, invalid })
  }

  function handleDrop(event: DragEvent<HTMLLIElement>) {
    event.preventDefault()
    if (!activeDrop || activeDrop.targetId !== node.id || activeDrop.invalid) return
    void onDrop(node, activeDrop.placement)
  }

  const rowMenu = usePageTreeRowMenu({
    kind: node.kind,
    isFavorite: favoriteIds.includes(node.id),
    onToggleFavorite: () => onToggleFavorite(node.id),
    onRename: () => {
      setEditTitle(node.title)
      setIsEditing(true)
    },
    onAddSubPage: () => void handleAddSubPage(),
    onAddSubFolder: () => void handleAddSubFolder(),
    onConvertToFolder: () => void handleConvert('folder'),
    onConvertToNote: () => void handleConvert('note'),
    onDelete: () => void handleDelete(),
  })

  const pageIcon = showPageIcons ? (
    <PageIconPicker
      value={node.icon}
      onSelect={(icon) => void updateIcon.mutateAsync({ pageId: node.id, icon })}
      trigger={
        <span className="flex items-center justify-center">
          <PageTreeNodeIcon
            kind={node.kind}
            hasChildren={hasChildren}
            isExpanded={expanded}
            isActive={isActive}
            icon={node.icon}
          />
        </span>
      }
    />
  ) : null

  return (
    <>
      <li
        draggable={canEdit && !isEditing}
        onDragStart={canEdit ? handleDragStart : undefined}
        onDragEnd={onDragEnd}
        onDragOver={canEdit ? handleDragOver : undefined}
        onDragLeave={() => {
          if (activeDrop?.targetId === node.id) onDropTargetChange(null)
        }}
        onDrop={handleDrop}
        className={cn(
          'select-none',
          canEdit && !isEditing && 'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-35',
        )}
      >
        <PageTreeRowFrame depth={depth}>
          <div className="relative min-w-0" data-tree-row>
            {isDropTarget && activeDrop ? (
              <DropIndicator placement={activeDrop.placement} invalid={activeDrop.invalid} />
            ) : null}

            <SidebarTreeRow
              depth={0}
              hasChildren={showsChildren}
              isActive={isActive}
              isRenaming={isEditing}
              isExpanded={expanded}
            leading={showsChildren ? undefined : pageIcon}
            onToggle={showsChildren && !isEditing ? () => onToggle(node.id) : undefined}
            onAddPage={canEdit && isFolder && !isEditing ? () => void handleAddSubPage() : undefined}
            onAddFolder={canEdit && isFolder && !isEditing ? () => void handleAddSubFolder() : undefined}
            onActivate={!showsChildren && !isEditing ? activatePage : undefined}
            onHover={() => prefetchPage(queryClient, spaceId, node.id)}
            onContextMenu={canEdit && !isEditing ? rowMenu.onContextMenu : undefined}
            trailing={canEdit && !isEditing ? rowMenu.trigger : null}
          >
            {showsChildren && !isEditing ? pageIcon : null}
            {isEditing ? (
              <PageTreeRowRenameInput
                value={editTitle}
                onChange={setEditTitle}
                onCommit={() => void commitRename()}
                onCancel={cancelRename}
                isActive={isActive}
              />
            ) : (
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-xs leading-5 tracking-dashboard',
                  isActive ? 'font-medium text-text-inverse' : 'text-text-inverse/62',
                )}
                title={node.title}
              >
                {node.title}
              </span>
            )}
            {(node.openCommentCount ?? 0) > 0 ? (
              <span
                className="ml-1 shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-200/90"
                title={`${node.openCommentCount} open comment threads`}
              >
                {node.openCommentCount}
              </span>
            ) : null}

          </SidebarTreeRow>
            {rowMenu.panel}
          </div>
        </PageTreeRowFrame>
      </li>
      {showsChildren ? (
        <li role="presentation">
          <SidebarCollapsiblePanel expanded={expanded}>
            <ul className="space-y-0.5">
              {node.children.map((child) => (
                <PageTreeNodeRow
                  key={child.id}
                  node={child}
                  spaceId={spaceId}
                  depth={depth + 1}
                  flatPages={flatPages}
                  activePageId={activePageId}
                  pendingPageId={pendingPageId}
                  draggedId={draggedId}
                  activeDrop={activeDrop}
                  favoriteIds={favoriteIds}
                  isExpanded={isExpanded}
                  onToggle={onToggle}
                  onExpand={onExpand}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropTargetChange={onDropTargetChange}
                  onDrop={onDrop}
                  onToggleFavorite={onToggleFavorite}
                  canEdit={canEdit}
                />
              ))}
            </ul>
          </SidebarCollapsiblePanel>
        </li>
      ) : null}
    </>
  )
}
