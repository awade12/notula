import { SidebarBlock } from '@/features/workspace/components/sidebar/sidebar-block'
import { sidebarRow } from '@/features/workspace/lib/sidebar-classes'
import type { WorkspaceIconDefinition } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'
import { PageTreeNodeIcon } from './page-tree-node-icon'

type ShortcutPage = {
  id: string
  title: string
  kind: string
  icon: string | null
}

type PageShortcutSectionProps = {
  label: string
  icon?: WorkspaceIconDefinition
  pages: ShortcutPage[]
  activePageId?: string
  onOpen: (pageId: string) => void
  onHover: (pageId: string) => void
  scrollable?: boolean
  collapsible?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
  emptyHint?: string
}

export function PageShortcutSection({
  label,
  icon,
  pages,
  activePageId,
  onOpen,
  onHover,
  scrollable = false,
  collapsible = false,
  expanded = true,
  onToggleExpanded,
  emptyHint,
}: PageShortcutSectionProps) {
  const isExpanded = collapsible ? expanded : true
  const showEmptyHint = isExpanded && pages.length === 0 && emptyHint

  if (collapsible && pages.length === 0 && !emptyHint) {
    return null
  }

  return (
    <SidebarBlock
      label={label}
      icon={icon}
      collapsible={collapsible}
      expanded={isExpanded}
      onToggle={onToggleExpanded}
    >
      {showEmptyHint ? (
        <p className="rounded-lg px-2 py-2 text-xs tracking-dashboard text-text-inverse/30">
          {emptyHint}
        </p>
      ) : pages.length > 0 ? (
        <ul
          className={cn('space-y-0.5 pb-1', scrollable && 'scrollbar-none max-h-36 overflow-y-auto')}
          aria-label={label}
        >
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onOpen(page.id)}
                onMouseEnter={() => onHover(page.id)}
                className={sidebarRow(activePageId === page.id)}
                title={page.title}
              >
                <PageTreeNodeIcon
                  kind={page.kind}
                  hasChildren={false}
                  isExpanded={false}
                  isActive={activePageId === page.id}
                  icon={page.icon}
                />
                <span className="min-w-0 flex-1 truncate">{page.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </SidebarBlock>
  )
}
