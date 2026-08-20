import { LayoutGrid, NotebookPen, StickyNote } from 'lucide-react'
import { selectOptionClassName, selectOptionDotClassName } from '@/features/database/lib/select-option-styles'
import { PageTreeNodeIcon } from '@/features/workspace/components/page-tree/page-tree-node-icon'
import { SidebarBlock } from '@/features/workspace/components/sidebar/sidebar-block'
import { SidebarSearchTrigger } from '@/features/workspace/components/sidebar/sidebar-search-trigger'
import { SidebarTreeRow } from '@/features/workspace/components/sidebar/sidebar-tree-row'
import { SpaceAvatar } from '@/features/workspace/components/sidebar/space-avatar'
import { encodePageIcon } from '@/features/workspace/lib/page-icon-value'
import { sidebarDivider, sidebarModeTab, sidebarModeTabs, sidebarWorkspaceRow } from '@/features/workspace/lib/sidebar-classes'
import { pageIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'

const previewPages = [
  {
    title: 'Product roadmap',
    kind: 'note',
    icon: encodePageIcon('rocket-01', '#38bdf8'),
    active: true,
    depth: 1,
  },
  {
    title: 'Meeting notes',
    kind: 'note',
    icon: encodePageIcon('notebook-01', '#a78bfa'),
    active: false,
    depth: 1,
  },
  {
    title: 'Ideas',
    kind: 'note',
    icon: encodePageIcon('idea-01', '#fbbf24'),
    active: false,
    depth: 1,
  },
] as const

const previewTasks = [
  {
    title: 'Ship onboarding flow',
    labels: [{ label: 'Feature', color: 'blue' as const }],
    due: 'Fri',
    assignee: 'AW',
  },
  {
    title: 'Review launch checklist',
    labels: [{ label: 'Launch', color: 'purple' as const }],
    linkedNote: 'Product roadmap',
    assignee: 'MK',
  },
] as const

type PreviewTask = {
  title: string
  labels: ReadonlyArray<{ label: string; color: 'blue' | 'purple' | 'green' | 'red' | 'yellow' }>
  due?: string
  linkedNote?: string
  assignee: string
}

function PreviewModeTabs() {
  return (
    <div className={sidebarModeTabs()} aria-hidden>
      <div className={sidebarModeTab(true)}>
        <NotebookPen className="size-3.5 shrink-0" strokeWidth={1.75} />
        Notes
      </div>
      <div className={cn(sidebarModeTab(false), 'opacity-70')}>
        <LayoutGrid className="size-3.5 shrink-0" strokeWidth={1.75} />
        Projects
      </div>
    </div>
  )
}

function PreviewTaskCard({ title, labels, due, linkedNote, assignee }: PreviewTask) {
  return (
    <div
      className={cn(
        'w-full rounded-md border border-border/40 bg-background/50 p-2.5 text-left shadow-sm',
        'ring-1 ring-white/[0.03]',
      )}
    >
      <span className="block text-sm font-medium leading-snug text-text-emphasis">{title}</span>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {labels.map((label) => (
          <span
            key={label.label}
            className={cn('rounded px-1.5 py-0.5 text-[10px]', selectOptionClassName(label.color))}
          >
            {label.label}
          </span>
        ))}
        {due ? <span className="text-[10px] tabular-nums text-text-primary/45">{due}</span> : null}
        {linkedNote ? (
          <span className="inline-flex max-w-full items-center gap-1 text-[10px] text-text-primary/45">
            <StickyNote className="size-3 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{linkedNote}</span>
          </span>
        ) : null}
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-medium text-text-emphasis">
          {assignee}
        </span>
      </div>
    </div>
  )
}

export function LoginAppPreview() {
  return (
    <div
      className={cn(
        'pointer-events-none mt-auto w-full select-none rounded-panel border border-border/70',
        'bg-sidebar p-3 shadow-xl shadow-black/20 ring-1 ring-white/[0.04]',
      )}
      aria-hidden
    >
      <div className={sidebarWorkspaceRow(false)}>
        <SpaceAvatar name="Personal" className="size-7 rounded-md" />
        <span className="truncate font-medium text-text-inverse">Personal</span>
      </div>

      <div className="mt-2">
        <PreviewModeTabs />
      </div>

      <div className="mt-2">
        <SidebarSearchTrigger placeholder="Search pages…" onClick={() => {}} />
      </div>

      <SidebarBlock label="Pages" icon={pageIcon} className="mt-3">
        <SidebarTreeRow
          hasChildren
          isExpanded
          onToggle={() => {}}
          leading={
            <PageTreeNodeIcon kind="folder" hasChildren isExpanded icon={null} />
          }
        >
          <span className="truncate text-text-inverse/75">Workspace</span>
        </SidebarTreeRow>

        {previewPages.map((page) => (
          <SidebarTreeRow
            key={page.title}
            depth={page.depth}
            isActive={page.active}
            leading={
              <PageTreeNodeIcon
                kind={page.kind}
                hasChildren={false}
                isExpanded={false}
                isActive={page.active}
                icon={page.icon}
              />
            }
          >
            <span
              className={cn(
                'truncate',
                page.active ? 'font-medium text-text-inverse' : 'text-text-inverse/70',
              )}
            >
              {page.title}
            </span>
          </SidebarTreeRow>
        ))}
      </SidebarBlock>

      <div className={cn(sidebarDivider(), 'my-4')} />

      <div className="rounded-lg border border-border/60 bg-surface p-2.5">
        <div className="mb-2 flex items-center gap-1.5 px-0.5">
          <span className={cn('size-2 rounded-full', selectOptionDotClassName('blue'))} />
          <span className="text-xs font-medium tracking-dashboard text-text-emphasis">In progress</span>
          <span className="ml-auto text-meta tabular-nums text-text-primary/45">2</span>
        </div>
        <div className="space-y-2">
          {previewTasks.map((task) => (
            <PreviewTaskCard key={task.title} {...task} />
          ))}
        </div>
      </div>
    </div>
  )
}
