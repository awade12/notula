import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { useLoadedPageIcon } from '@/features/workspace/hooks/use-loaded-page-icon'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'

type LoadedPageIconProps = {
  iconName: string
  size?: number
  className?: string
  strokeWidth?: number
}

export function LoadedPageIcon({
  iconName,
  size = iconSize.menu,
  className,
  strokeWidth = 1.75,
}: LoadedPageIconProps) {
  const { data: icon } = useLoadedPageIcon(iconName)

  if (!icon) {
    return <span className={cn('inline-block shrink-0 rounded-sm bg-white/10', className)} style={{ width: size, height: size }} />
  }

  return (
    <WorkspaceIcon
      icon={icon as WorkspaceIconDefinition}
      size={size}
      strokeWidth={strokeWidth}
      className={cn('text-current', className)}
    />
  )
}
