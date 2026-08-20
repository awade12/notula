import { useCallback, type MouseEvent } from 'react'
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
  onDelete,
}: UseProjectTaskRowMenuProps) {
  const menu = useSidebarFloatingMenu({
    menuWidth: 208,
    menuHeight: 120,
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
      if (readOnly) return
      event.preventDefault()
      event.stopPropagation()
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
        onDelete={onDelete}
      />
    </SidebarFloatingMenuPanel>
  )

  return {
    panel,
    onContextMenu: readOnly ? undefined : onContextMenu,
  }
}
