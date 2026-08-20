import { PageAiInsightsBanner } from '@/features/ai/components/page-ai-insights-banner'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { BacklinksPanel } from '@/features/links/components/backlinks-panel'
import { Breadcrumbs } from '@/features/workspace/components/breadcrumbs'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import type { BreadcrumbItem } from '@/features/workspace/lib/build-breadcrumbs'
import { cn } from '@/lib/cn'
import type { NotesEditor } from '../lib/block-schema'
import { EditorWorkspaceProvider } from '../context/editor-workspace-context'
import { EditorBodySkeleton } from './editor-body-skeleton'
import { EditorSurface } from './editor-surface'
import { PageTitleInput } from './page-title-input'

import { EditorPagePresence } from './presence/editor-page-presence'
import type { HocuspocusProvider } from '@hocuspocus/provider'

type EditorPageProps = {
  editor: NotesEditor
  title: string
  onTitleChange: (value: string) => void
  onTitleFocus: () => void
  onTitleBlur: () => void
  spaceId: string
  pageId: string
  pages: FlatPage[]
  breadcrumbs?: BreadcrumbItem[]
  icon?: string | null
  onIconChange?: (icon: string | null) => void
  isContentReady?: boolean
  provider?: HocuspocusProvider | null
  canEdit?: boolean
}

export function EditorPage({
  editor,
  title,
  onTitleChange,
  onTitleFocus,
  onTitleBlur,
  spaceId,
  pageId,
  pages,
  breadcrumbs = [],
  icon = null,
  onIconChange,
  isContentReady = true,
  provider = null,
  canEdit = true,
}: EditorPageProps) {
  return (
    <EditorWorkspaceProvider spaceId={spaceId}>
      <div className="notes-editor-page">
      {breadcrumbs.length > 0 ? (
        <Breadcrumbs spaceId={spaceId} items={breadcrumbs} />
      ) : null}
      <PageAiInsightsBanner spaceId={spaceId} pageId={pageId} />
      <div className="mb-2 flex items-center gap-3">
        {onIconChange ? (
          <PageIconPicker
            variant="surface"
            align="left"
            value={icon}
            onSelect={onIconChange}
            trigger={
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] transition-colors hover:bg-white/[0.08]">
                {icon ? (
                  <PageIconDisplay value={icon} size={22} />
                ) : (
                  <span className="text-lg text-text-primary/35">+</span>
                )}
              </span>
            }
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <PageTitleInput
            title={title}
            onChange={onTitleChange}
            onFocus={onTitleFocus}
            onBlur={onTitleBlur}
            onEnter={() => editor.focus()}
            readOnly={!canEdit}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EditorPagePresence provider={provider} />
        </div>
      </div>
      <div className="relative min-h-32">
        {!isContentReady ? <EditorBodySkeleton /> : null}
        <div
          className={cn(
            'transition-opacity duration-150',
            isContentReady ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <EditorSurface
            editor={editor}
            spaceId={spaceId}
            pageId={pageId}
            pages={pages}
            pageTitle={title}
            canEdit={canEdit}
          />
        </div>
      </div>
      {isContentReady ? <BacklinksPanel spaceId={spaceId} pageId={pageId} /> : null}
      </div>
    </EditorWorkspaceProvider>
  )
}
