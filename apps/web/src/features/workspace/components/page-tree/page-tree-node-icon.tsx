import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { cn } from '@/lib/cn'
import { isFolderKind } from '@/features/workspace/types/page-kind'
import {
  folderIcon,
  folderOpenIcon,
  pageIcon,
} from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'

type PageTreeNodeIconProps = {
  kind: string
  hasChildren: boolean
  isExpanded: boolean
  isActive?: boolean
  icon?: string | null
}

export function PageTreeNodeIcon({
  kind,
  hasChildren,
  isExpanded,
  isActive = false,
  icon,
}: PageTreeNodeIconProps) {
  if (icon) {
    return (
      <PageIconDisplay
        value={icon}
        size={iconSize.tree - 2}
        className={cn(isActive ? 'opacity-100' : 'opacity-85')}
      />
    )
  }

  const isFolder = isFolderKind(kind) || hasChildren
  const iconDef = isFolder ? (isExpanded ? folderOpenIcon : folderIcon) : pageIcon

  return (
    <WorkspaceIcon
      icon={iconDef}
      size={iconSize.tree}
      strokeWidth={1.75}
      className={cn(
        'translate-y-px',
        isFolder && !isActive && 'text-text-inverse/45',
        isFolder && isActive && 'text-text-inverse/75',
        !isFolder && !isActive && 'text-text-inverse/40',
        !isFolder && isActive && 'text-text-inverse/85',
      )}
    />
  )
}
