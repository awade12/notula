import {
  SidebarContextMenuDivider,
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import {
  deleteIcon,
  editIcon,
  favoriteActiveIcon,
  favoriteIcon,
  folderAddIcon,
  folderImportIcon,
  pageAddIcon,
  pageIcon,
} from '@/features/workspace/lib/workspace-icon-pack'
import type { PageKind } from '../../types/page-kind'
import { isFolderKind } from '../../types/page-kind'

export type PageTreeActionsMenuHandlers = {
  onToggleFavorite: () => void
  onRename: () => void
  onAddSubPage: () => void
  onAddSubFolder: () => void
  onConvertToFolder?: () => void
  onConvertToNote?: () => void
  onDelete: () => void
}

type PageTreeActionsMenuContentProps = PageTreeActionsMenuHandlers & {
  kind: PageKind
  isFavorite: boolean
  onAction: (action: () => void) => void
}

export function PageTreeActionsMenuContent({
  kind,
  isFavorite,
  onAction,
  onToggleFavorite,
  onRename,
  onAddSubPage,
  onAddSubFolder,
  onConvertToFolder,
  onConvertToNote,
  onDelete,
}: PageTreeActionsMenuContentProps) {
  return (
    <SidebarContextMenuList>
      <SidebarContextMenuItem
        icon={favoriteIcon}
        altIcon={favoriteActiveIcon}
        showAlt={isFavorite}
        label={isFavorite ? 'Remove favorite' : 'Add to favorites'}
        tone={isFavorite ? 'accent' : 'default'}
        onClick={() => onAction(onToggleFavorite)}
      />
      <SidebarContextMenuItem
        icon={editIcon}
        label="Rename"
        onClick={() => onAction(onRename)}
      />

      <SidebarContextMenuDivider />

      {isFolderKind(kind) ? (
        <>
          <SidebarContextMenuItem
            icon={pageAddIcon}
            label="New page inside"
            onClick={() => onAction(onAddSubPage)}
          />
          <SidebarContextMenuItem
            icon={folderAddIcon}
            label="New folder inside"
            onClick={() => onAction(onAddSubFolder)}
          />
          <SidebarContextMenuDivider />
        </>
      ) : null}

      {isFolderKind(kind) ? (
        <SidebarContextMenuItem
          icon={pageIcon}
          label="Turn into note"
          onClick={() => onAction(() => onConvertToNote?.())}
        />
      ) : (
        <SidebarContextMenuItem
          icon={folderImportIcon}
          label="Turn into folder"
          onClick={() => onAction(() => onConvertToFolder?.())}
        />
      )}

      <SidebarContextMenuDivider />

      <SidebarContextMenuItem
        icon={deleteIcon}
        label="Delete"
        destructive
        onClick={() => onAction(onDelete)}
      />
    </SidebarContextMenuList>
  )
}
