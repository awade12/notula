import { SidebarMotionChevron } from '@/features/workspace/components/sidebar/sidebar-motion-chevron'
import { SidebarTreeAddMenu } from '@/features/workspace/components/sidebar/sidebar-tree-add-menu'
import {
  sidebarRowActionsRail,
  sidebarRowContentPad,
  sidebarTreeRowContentCluster,
  sidebarTreeRowLeadingSlot,
  sidebarTreeRowSurface,
} from '@/features/workspace/lib/sidebar-classes'
import { chevronRightIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'

type SidebarTreeRowProps = {
  depth?: number
  isActive?: boolean
  isRenaming?: boolean
  isExpanded?: boolean
  hasChildren?: boolean
  leading?: ReactNode
  onToggle?: () => void
  onAddPage?: () => void
  onAddFolder?: () => void
  onActivate?: () => void
  onHover?: () => void
  onContextMenu?: (event: MouseEvent) => void
  trailing?: ReactNode
  children: ReactNode
}

function stopBubble(event: MouseEvent | PointerEvent) {
  event.stopPropagation()
}

export function SidebarTreeRow({
  depth = 0,
  isActive = false,
  isRenaming = false,
  isExpanded = false,
  hasChildren = false,
  leading,
  onToggle,
  onAddPage,
  onAddFolder,
  onActivate,
  onHover,
  onContextMenu,
  trailing,
  children,
}: SidebarTreeRowProps) {
  const isExpandable = hasChildren && Boolean(onToggle) && !isRenaming
  const isInteractive = !isRenaming && (isExpandable || Boolean(onActivate))
  const hasActions = !isRenaming && Boolean(onAddPage || onAddFolder || trailing)
  const leadingContent = hasChildren ? (
    <SidebarMotionChevron
      icon={chevronRightIcon}
      expanded={isExpanded}
      size={iconSize.chevron}
      strokeWidth={2}
      className="text-text-inverse/32"
    />
  ) : (
    leading
  )

  function handleRowClick() {
    if (isExpandable) {
      onToggle?.()
      return
    }
    onActivate?.()
  }

  return (
    <div
      data-sidebar-row
      className="group/row flex min-w-0 items-center"
      style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
      onMouseEnter={onHover}
    >
      <div
        aria-expanded={isExpandable ? isExpanded : undefined}
        aria-label={
          isExpandable ? (isExpanded ? 'Collapse folder' : 'Expand folder') : undefined
        }
        onClick={isInteractive ? handleRowClick : undefined}
        onContextMenu={onContextMenu}
        className={cn(
          sidebarTreeRowSurface(isActive || isRenaming, isInteractive),
          isInteractive && 'cursor-pointer',
          isRenaming && 'cursor-text bg-white/[0.08]',
        )}
      >
        <div className={sidebarTreeRowContentCluster()}>
          {leadingContent ? (
            <span className={sidebarTreeRowLeadingSlot()} aria-hidden={hasChildren}>
              {leadingContent}
            </span>
          ) : null}

          <div
            className={cn(
              'flex min-w-0 flex-1 items-center outline-none',
              sidebarRowContentPad(hasActions),
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
          </div>
        </div>

        {hasActions ? (
          <div
            className={sidebarRowActionsRail(isActive)}
            onPointerDown={stopBubble}
            onClick={stopBubble}
          >
            {onAddPage && onAddFolder ? (
              <SidebarTreeAddMenu onAddPage={onAddPage} onAddFolder={onAddFolder} />
            ) : null}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  )
}
