import { useCallback, useState, type MouseEvent } from 'react'
import { SidebarFloatingMenuPanel } from '@/features/workspace/components/sidebar/sidebar-floating-menu-panel'
import { useSidebarFloatingMenu } from '@/features/workspace/hooks/use-sidebar-floating-menu'
import {
  ProjectTaskActionsMenuContent,
  type ProjectTaskActionsMenuHandlers,
} from '../components/project-task-actions-menu-content'

type UseProjectTaskRowMenuProps = ProjectTaskActionsMenuHandlers & {
  readOnly?: boolean
}

export function useProjectTaskRowMenu({
  readOnly = false,
  onOpen,
  onDuplicate,
  onArchive,
  onMoveToBoard,
  onDelete,
  boards,
  currentBoardId,
}: UseProjectTaskRowMenuProps) {
  const [showMoveTargets, setShowMoveTargets] = useState(false)
  const menu = useSidebarFloatingMenu({
    menuWidth: 208,
    menuHeight: showMoveTargets ? 320 : 220,
  })

  const runAction = useCallback(
    (action: () => void) => {
      menu.close()
      setShowMoveTargets(false)
      action()
    },
    [menu],
  )

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      if (readOnly) return
      event.preventDefault()
      event.stopPropagation()
      setShowMoveTargets(false)
      menu.openAt(event.clientX, event.clientY)
    },
    [menu, readOnly],
  )

  const panel = (
    <SidebarFloatingMenuPanel
      open={menu.open}
      coords={menu.coords}
      menuRef={menu.menuRef}
      width={208}
    >
      <ProjectTaskActionsMenuContent
        onAction={runAction}
        onOpen={onOpen}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onMoveToBoard={onMoveToBoard}
        onDelete={onDelete}
        boards={boards}
        currentBoardId={currentBoardId}
        showMoveTargets={showMoveTargets}
        onToggleMoveTargets={() => setShowMoveTargets((current) => !current)}
      />
    </SidebarFloatingMenuPanel>
  )

  return {
    panel,
    onContextMenu: readOnly ? undefined : onContextMenu,
  }
}
