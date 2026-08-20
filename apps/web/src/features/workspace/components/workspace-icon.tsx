import { HugeiconsIcon } from '@hugeicons/react'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'

type WorkspaceIconProps = {
  icon: WorkspaceIconDefinition
  altIcon?: WorkspaceIconDefinition
  showAlt?: boolean
  className?: string
  size?: number
  strokeWidth?: number
}

export function WorkspaceIcon({
  icon,
  altIcon,
  showAlt = false,
  className,
  size = iconSize.nav,
  strokeWidth = 1.5,
}: WorkspaceIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      altIcon={altIcon}
      showAlt={showAlt}
      size={size}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
      aria-hidden
    />
  )
}
