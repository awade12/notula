import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'

type SidebarIconProps = {
  icon: WorkspaceIconDefinition
  altIcon?: WorkspaceIconDefinition
  showAlt?: boolean
  className?: string
  strokeWidth?: number
  size?: number
}

export function SidebarIcon({
  icon,
  altIcon,
  showAlt,
  className,
  strokeWidth = 1.5,
  size = iconSize.nav,
}: SidebarIconProps) {
  return (
    <WorkspaceIcon
      icon={icon}
      altIcon={altIcon}
      showAlt={showAlt}
      className={className}
      strokeWidth={strokeWidth}
      size={size}
    />
  )
}
