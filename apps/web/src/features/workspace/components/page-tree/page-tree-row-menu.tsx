import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, type MouseEvent } from 'react'
import { SidebarFloatingMenuPanel } from '@/features/workspace/components/sidebar/sidebar-floating-menu-panel'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { useSidebarFloatingMenu } from '@/features/workspace/hooks/use-sidebar-floating-menu'
import { sidebarMenuButtonTap } from '@/features/workspace/lib/sidebar-motion'
import { sidebarRowActionButton } from '@/features/workspace/lib/sidebar-classes'
import { moreIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import type { PageKind } from '../../types/page-kind'
import {
  PageTreeActionsMenuContent,
  type PageTreeActionsMenuHandlers,
} from './page-tree-actions-menu-content'

type PageTreeRowMenuProps = PageTreeActionsMenuHandlers & {
  kind: PageKind
  isFavorite: boolean
}

export function usePageTreeRowMenu({
  kind,
  isFavorite,
  onToggleFavorite,
  onRename,
  onAddSubPage,
  onAddSubFolder,
  onConvertToFolder,
  onConvertToNote,
  onDelete,
}: PageTreeRowMenuProps) {
  const prefersReducedMotion = useReducedMotion()
  const menu = useSidebarFloatingMenu({
    menuWidth: 208,
    menuHeight: 320,
  })

  const runAction = useCallback(
    (action: () => void) => {
      menu.close()
      action()
    },
    [menu],
  )

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      menu.openAt(event.clientX, event.clientY)
    },
    [menu],
  )

  const trigger = (
    <motion.button
      ref={menu.anchorRef}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        menu.toggle()
      }}
      whileTap={prefersReducedMotion ? undefined : sidebarMenuButtonTap}
      className={cn(
        sidebarRowActionButton(),
        menu.open && 'bg-white/10 text-text-inverse',
      )}
      aria-expanded={menu.open}
      aria-haspopup="menu"
      aria-label="Page actions"
    >
      <SidebarIcon icon={moreIcon} size={iconSize.menu} strokeWidth={2} />
    </motion.button>
  )

  const panel = (
    <SidebarFloatingMenuPanel
      open={menu.open}
      coords={menu.coords}
      menuRef={menu.menuRef}
      width={208}
    >
      <PageTreeActionsMenuContent
        kind={kind}
        isFavorite={isFavorite}
        onAction={runAction}
        onToggleFavorite={onToggleFavorite}
        onRename={onRename}
        onAddSubPage={onAddSubPage}
        onAddSubFolder={onAddSubFolder}
        onConvertToFolder={onConvertToFolder}
        onConvertToNote={onConvertToNote}
        onDelete={onDelete}
      />
    </SidebarFloatingMenuPanel>
  )

  return {
    trigger,
    panel,
    onContextMenu,
    isOpen: menu.open,
  }
}
