import type { ReactNode } from 'react'
import { SidebarCollapsiblePanel } from '@/features/workspace/components/sidebar/sidebar-collapsible-panel'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { SidebarMotionChevron } from '@/features/workspace/components/sidebar/sidebar-motion-chevron'
import {
  sidebarSectionHeading,
  sidebarSectionHeaderRow,
  sidebarSectionIconTile,
  sidebarSectionStaticHeader,
  sidebarSectionToggleButton,
} from '@/features/workspace/lib/sidebar-classes'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { chevronRightIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'

type SidebarBlockProps = {
  label: string
  icon?: WorkspaceIconDefinition
  action?: ReactNode
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
  sticky?: boolean
  children?: ReactNode
  className?: string
}

export function SidebarBlock({
  label,
  icon,
  action,
  collapsible = false,
  expanded = true,
  onToggle,
  sticky = false,
  children,
  className,
}: SidebarBlockProps) {
  const isExpanded = collapsible ? expanded : true

  const labelNode = (
    <span className={sidebarSectionHeading(isExpanded)}>{label}</span>
  )

  const iconNode = icon ? (
    <span className={sidebarSectionIconTile()}>
      <SidebarIcon icon={icon} size={iconSize.section} strokeWidth={1.75} />
    </span>
  ) : null

  const headerInner = collapsible ? (
    <button
      type="button"
      onClick={onToggle}
      className={sidebarSectionToggleButton(isExpanded)}
      aria-expanded={isExpanded}
    >
      <SidebarMotionChevron
        icon={chevronRightIcon}
        expanded={isExpanded}
        size={iconSize.chevron}
        strokeWidth={2}
        className="text-text-inverse/35"
      />
      {iconNode}
      {labelNode}
    </button>
  ) : (
    <div className={sidebarSectionStaticHeader()}>
      {iconNode}
      {labelNode}
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  )

  return (
    <section className={cn('pb-3', className)}>
      <div className={sidebarSectionHeaderRow(sticky)}>
        {collapsible ? (
          <>
            <div className="min-w-0 flex-1">{headerInner}</div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </>
        ) : (
          headerInner
        )}
      </div>

      {children ? (
        collapsible ? (
          <SidebarCollapsiblePanel expanded={isExpanded} innerClassName="pt-0.5">
            {children}
          </SidebarCollapsiblePanel>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        )
      ) : null}
    </section>
  )
}
