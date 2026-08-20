import {
  SidebarContextMenuDivider,
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import { deleteIcon, editIcon } from '@/features/workspace/lib/workspace-icon-pack'

export type ProjectTaskActionsMenuHandlers = {
  onOpen: () => void
  onDelete: () => void
}

type ProjectTaskActionsMenuContentProps = ProjectTaskActionsMenuHandlers & {
  onAction: (action: () => void) => void
}

export function ProjectTaskActionsMenuContent({
  onAction,
  onOpen,
  onDelete,
}: ProjectTaskActionsMenuContentProps) {
  return (
    <SidebarContextMenuList>
      <SidebarContextMenuItem
        icon={editIcon}
        label="Open task"
        onClick={() => onAction(onOpen)}
      />
      <SidebarContextMenuDivider />
      <SidebarContextMenuItem
        icon={deleteIcon}
        label="Delete task"
        destructive
        onClick={() => onAction(onDelete)}
      />
    </SidebarContextMenuList>
  )
}
