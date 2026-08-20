import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type * as Y from 'yjs'
import { EditorAiProvider } from '@/features/ai/context/editor-ai-context'
import { AiPanel } from '@/features/ai/components/ai-panel'
import { AiPanelToggle } from '@/features/ai/components/ai-panel-toggle'
import { EditorPage } from '@/features/editor/components/editor-page'
import { EditorShell } from '@/features/editor/components/editor-shell'
import { EditorWithAiPanel } from '@/features/editor/components/editor-with-ai-panel'
import { useCollabProvider } from '@/features/editor/hooks/use-collab-provider'
import { useEditorInstance } from '@/features/editor/hooks/use-editor-instance'
import { usePage } from '@/features/editor/hooks/use-page'
import { usePageBootstrap } from '@/features/editor/hooks/use-page-bootstrap'
import { usePageTitle } from '@/features/editor/hooks/use-page-title'
import { docHasContent, isPageWarm } from '@/features/editor/lib/hydrate-doc'
import { getCachedPageTitle } from '@/features/editor/lib/get-cached-page-title'
import { prefetchPage } from '@/features/editor/lib/prefetch-page'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { usePageActions } from '@/features/workspace/hooks/use-page-actions'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { useSpaces } from '@/features/workspace/hooks/use-spaces'
import { buildBreadcrumbs } from '@/features/workspace/lib/build-breadcrumbs'
import { useInsightCollabSync } from '@/features/insights/hooks/use-insight-collab-sync'
import type { ConnectionStatus } from '@/features/editor/types'
import { FolderBrowser } from '@/features/workspace/components/folder-browser/folder-browser'
import { isFolderKind } from '@/features/workspace/types/page-kind'

export const Route = createFileRoute('/_app/s/$spaceId/p/$pageId')({
  ssr: false,
  beforeLoad: ({ context, params }) => {
    prefetchPage(context.queryClient, params.spaceId, params.pageId)
  },
  component: PageRoute,
})

const appRoute = getRouteApi('/_app')

function PageRoute() {
  const { spaceId, pageId } = Route.useParams()
  const { data: page, isLoading } = usePage(spaceId, pageId)

  if (isLoading && !page) {
    return <p className="text-sm tracking-dashboard text-text-primary">Loading…</p>
  }

  if (page && isFolderKind(page.kind)) {
    return (
      <FolderBrowser spaceId={spaceId} folderId={pageId} folderTitle={page.title} />
    )
  }

  return <NoteEditorRoute spaceId={spaceId} pageId={pageId} pageTitle={page?.title} />
}

function NoteEditorRoute({
  spaceId,
  pageId,
  pageTitle,
}: {
  spaceId: string
  pageId: string
  pageTitle?: string
}) {
  const { user } = appRoute.useRouteContext()
  const queryClient = useQueryClient()
  const { data: page } = usePage(spaceId, pageId)
  const { doc, provider, status } = useCollabProvider(
    pageId,
    spaceId,
    queryClient,
  )
  const isBootstrapped = usePageBootstrap(doc, spaceId, pageId)
  const isContentReady =
    isPageWarm(pageId, spaceId, queryClient) ||
    docHasContent(doc) ||
    isBootstrapped ||
    status === 'synced'
  const shellTitle =
    page?.title && page.title !== 'Untitled'
      ? page.title
      : pageTitle && pageTitle !== 'Untitled'
        ? pageTitle
        : getCachedPageTitle(queryClient, spaceId, pageId)

  return (
    <SyncedPageEditor
      key={pageId}
      doc={doc}
      provider={provider}
      user={user}
      spaceId={spaceId}
      pageId={pageId}
      initialTitle={page?.title ?? shellTitle}
      shellTitle={shellTitle}
      isContentReady={isContentReady}
      connectionStatus={status}
    />
  )
}

type SyncedPageEditorProps = {
  doc: Y.Doc
  provider: HocuspocusProvider | null
  user: { id: string; name: string }
  spaceId: string
  pageId: string
  initialTitle: string
  shellTitle: string
  isContentReady: boolean
  connectionStatus: ConnectionStatus
}

function SyncedPageEditor({
  doc,
  provider,
  user,
  spaceId,
  pageId,
  initialTitle,
  shellTitle,
  isContentReady,
  connectionStatus,
}: SyncedPageEditorProps) {
  const [aiOpen, setAiOpen] = useState(false)
  const queryClient = useQueryClient()
  const canEdit = useCanEditSpace(spaceId)
  const editor = useEditorInstance({ doc, provider, user, spaceId, canEdit })
  const { title, setPageTitle, onTitleFocus, onTitleBlur } = usePageTitle({
    doc,
    spaceId,
    pageId,
    initialTitle,
    isDocReady: isContentReady,
  })
  const { data: pageTree } = usePageTree(spaceId)
  const { data: spaces } = useSpaces()
  const { data: pageMeta } = usePage(spaceId, pageId)
  const { updateIcon } = usePageActions(spaceId)
  const pages = pageTree ? flattenPages(pageTree) : []
  const spaceName = spaces?.find((space) => space.id === spaceId)?.name ?? 'Teamspace'
  const breadcrumbs = buildBreadcrumbs(pages, pageId, spaceName)

  useInsightCollabSync({ editor, provider, queryClient })

  return (
    <EditorWithAiPanel
      open={aiOpen}
      toggle={
        canEdit ? (
          <AiPanelToggle open={aiOpen} onToggle={() => setAiOpen((open) => !open)} />
        ) : null
      }
      panel={
        canEdit ? (
          <AiPanel
            editor={editor}
            pageTitle={title || shellTitle}
            onClose={() => setAiOpen(false)}
          />
        ) : null
      }
    >
      <EditorShell connectionStatus={connectionStatus} readOnly={!canEdit}>
        <EditorAiProvider editor={editor} pageTitle={title || shellTitle}>
          <EditorPage
            editor={editor}
            title={title || shellTitle}
            onTitleChange={canEdit ? setPageTitle : () => {}}
            onTitleFocus={canEdit ? onTitleFocus : () => {}}
            onTitleBlur={canEdit ? onTitleBlur : () => {}}
            spaceId={spaceId}
            pageId={pageId}
            pages={pages}
            breadcrumbs={breadcrumbs}
            icon={pageMeta?.icon ?? null}
            onIconChange={
              canEdit ? (icon) => void updateIcon.mutateAsync({ pageId, icon }) : undefined
            }
            isContentReady={isContentReady}
            provider={provider}
            canEdit={canEdit}
          />
        </EditorAiProvider>
      </EditorShell>
    </EditorWithAiPanel>
  )
}
