import {
  SidebarContextMenuDivider,
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import { deleteIcon, editIcon, folderImportIcon, pageAddIcon } from '@/features/workspace/lib/workspace-icon-pack'
import type { ProjectBoardSummary } from '@/features/projects/hooks/use-project-boards'

export type ProjectTaskActionsMenuHandlers = {
  onOpen: () => void
  onDuplicate: () => void
  onArchive: () => void
  onMoveToBoard: (targetBoardId: string) => void
  onDelete: () => void
  boards?: ProjectBoardSummary[]
  currentBoardId: string
}

type ProjectTaskActionsMenuContentProps = ProjectTaskActionsMenuHandlers & {
  onAction: (action: () => void) => void
  showMoveTargets?: boolean
  onToggleMoveTargets?: () => void
}

export function ProjectTaskActionsMenuContent({
  onAction,
  onOpen,
  onDuplicate,
  onArchive,
  onMoveToBoard,
  onDelete,
  boards = [],
  currentBoardId,
  showMoveTargets = false,
  onToggleMoveTargets,
}: ProjectTaskActionsMenuContentProps) {
  const otherBoards = boards.filter((board) => board.id !== currentBoardId)

  return (
    <SidebarContextMenuList>
      <SidebarContextMenuItem
        icon={editIcon}
        label="Open task"
        onClick={() => onAction(onOpen)}
      />
      <SidebarContextMenuDivider />
      <SidebarContextMenuItem
        icon={pageAddIcon}
        label="Duplicate"
        onClick={() => onAction(onDuplicate)}
      />
      <SidebarContextMenuItem
        icon={editIcon}
        label="Archive"
        onClick={() => onAction(onArchive)}
      />
      {otherBoards.length > 0 ? (
        <SidebarContextMenuItem
          icon={folderImportIcon}
          label="Move to board…"
          onClick={() => onToggleMoveTargets?.()}
        />
      ) : null}
      {showMoveTargets
        ? otherBoards.map((board) => (
            <SidebarContextMenuItem
              key={board.id}
              icon={folderImportIcon}
              label={board.title}
              onClick={() => onAction(() => onMoveToBoard(board.id))}
            />
          ))
        : null}
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
