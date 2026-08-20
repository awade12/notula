import { FilePlus, Folder, FolderPlus, Table2 } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateDatabase } from '@/features/database/hooks/use-create-database'
import { useDatabases } from '@/features/database/hooks/use-rows'
import { Breadcrumbs } from '@/features/workspace/components/breadcrumbs'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import { buildBreadcrumbs } from '@/features/workspace/lib/build-breadcrumbs'
import { getFolderChildren } from '@/features/workspace/lib/build-tree'
import { flattenPages } from '@/features/editor/lib/flatten-pages'
import { usePageActions } from '@/features/workspace/hooks/use-page-actions'
import { usePageTree } from '@/features/workspace/hooks/use-page-tree'
import { useSpaces } from '@/features/workspace/hooks/use-spaces'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/cn'
import { FolderItemRow } from './folder-item-row'
import { DatabaseItemRow } from './database-item-row'

type FolderBrowserProps = {
  spaceId: string
  folderId: string | null
  folderTitle?: string
}

export function FolderBrowser({ spaceId, folderId, folderTitle }: FolderBrowserProps) {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const activePageId = 'pageId' in params ? params.pageId : undefined
  const queryClient = useQueryClient()
  const { data: tree, isLoading } = usePageTree(spaceId)
  const { data: databases = [], isLoading: databasesLoading } = useDatabases(spaceId, folderId)
  const createDatabase = useCreateDatabase(spaceId)
  const { data: spaces } = useSpaces()
  const { rename, updateIcon } = usePageActions(spaceId)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const flatPages = useMemo(() => (tree ? flattenPages(tree) : []), [tree])
  const space = spaces?.find((item) => item.id === spaceId)
  const currentFolder = folderId ? flatPages.find((page) => page.id === folderId) : null
  const children = useMemo(
    () => getFolderChildren(flatPages, folderId),
    [flatPages, folderId],
  )
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(flatPages, folderId, space?.name ?? 'Teamspace'),
    [flatPages, folderId, space?.name],
  )
  const heading =
    folderTitle ??
    currentFolder?.title ??
    (folderId ? 'Folder' : space?.name ?? 'Teamspace')
  const [editTitle, setEditTitle] = useState(heading)

  useEffect(() => {
    setEditTitle(heading)
  }, [heading])

  async function createItem(kind: 'note' | 'folder') {
    const response = await apiFetch(`/api/spaces/${spaceId}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parentId: folderId,
        kind,
        title: kind === 'folder' ? 'New folder' : 'Untitled',
      }),
    })

    if (!response.ok) return

    const page = (await response.json()) as { id: string; kind: string }
    await queryClient.invalidateQueries({ queryKey: ['pages', spaceId] })
    await navigate({
      to: '/s/$spaceId/p/$pageId',
      params: { spaceId, pageId: page.id },
    })
  }

  async function handleCreateDatabase() {
    const result = await createDatabase.mutateAsync({
      parentId: folderId,
      title: 'Untitled database',
    })
    await navigate({
      to: '/s/$spaceId/db/$databaseId',
      params: { spaceId, databaseId: result.database.id },
    })
  }

  const totalItems = children.length + databases.length

  async function commitFolderRename() {
    if (!folderId) return
    const nextTitle = editTitle.trim() || 'New folder'
    setIsEditingTitle(false)
    if (nextTitle === heading) return
    await rename.mutateAsync({ pageId: folderId, title: nextTitle })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-2 pb-16 pt-4">
      <Breadcrumbs spaceId={spaceId} items={breadcrumbs} />

      <div className="mb-8">
        <div className="flex items-start gap-3">
          {folderId && currentFolder ? (
            <PageIconPicker
              variant="surface"
              align="left"
              value={currentFolder.icon}
              onSelect={(icon) => void updateIcon.mutateAsync({ pageId: folderId, icon })}
              trigger={
                <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] transition-colors hover:bg-white/[0.08]">
                  {currentFolder.icon ? (
                    <PageIconDisplay value={currentFolder.icon} size={22} />
                  ) : (
                    <Folder className="size-5 text-text-primary/55" strokeWidth={1.75} />
                  )}
                </span>
              }
            />
          ) : (
            <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
              <Folder className="size-5 text-text-primary/55" strokeWidth={1.75} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            {folderId && isEditingTitle ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                onBlur={() => void commitFolderRename()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void commitFolderRename()
                  if (event.key === 'Escape') {
                    setEditTitle(heading)
                    setIsEditingTitle(false)
                  }
                }}
                className="w-full rounded-md bg-white/[0.06] px-2 py-1 text-2xl font-medium tracking-dashboard text-text-emphasis outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!folderId) return
                  setEditTitle(heading)
                  setIsEditingTitle(true)
                }}
                className={cn(
                  'block max-w-full truncate text-left text-2xl font-medium tracking-dashboard text-text-emphasis',
                  folderId && 'rounded-md transition-colors hover:bg-white/[0.04] px-1 -mx-1',
                )}
              >
                {heading}
              </button>
            )}
            <p className="mt-2 text-sm text-text-primary/70">
              {folderId
                ? `${totalItems === 1 ? '1 item' : `${totalItems} items`} in this folder.`
                : `${totalItems === 1 ? '1 item' : `${totalItems} items`} in this teamspace.`}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionButton
            icon={Table2}
            label="New database"
            primary
            onClick={() => void handleCreateDatabase()}
          />
          <ActionButton
            icon={FolderPlus}
            label="New folder"
            onClick={() => void createItem('folder')}
          />
          <ActionButton
            icon={FilePlus}
            label="New note"
            onClick={() => void createItem('note')}
          />
        </div>
      </div>

      {isLoading || databasesLoading ? (
        <div className="space-y-2">
          <div className="h-14 animate-pulse rounded-xl bg-white/[0.025]" />
          <div className="h-14 animate-pulse rounded-xl bg-white/[0.025]" />
        </div>
      ) : totalItems > 0 ? (
        <ul className="space-y-2">
          {children.map((item) => (
            <FolderItemRow
              key={item.id}
              spaceId={spaceId}
              item={item}
              flatPages={flatPages}
              activePageId={activePageId}
            />
          ))}
          {databases.map((item) => (
            <DatabaseItemRow key={item.id} spaceId={spaceId} item={item} />
          ))}
        </ul>
      ) : (
        <EmptyFolderState
          isNested={Boolean(folderId)}
          onCreateDatabase={() => void handleCreateDatabase()}
          onCreateFolder={() => void createItem('folder')}
          onCreateNote={() => void createItem('note')}
        />
      )}
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: typeof FilePlus
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium tracking-dashboard transition-colors',
        primary
          ? 'bg-sidebar text-text-inverse hover:opacity-90'
          : 'border border-border bg-white/[0.02] text-text-primary hover:bg-white/[0.04]',
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  )
}

function EmptyFolderState({
  isNested,
  onCreateDatabase,
  onCreateFolder,
  onCreateNote,
}: {
  isNested: boolean
  onCreateDatabase: () => void
  onCreateFolder: () => void
  onCreateNote: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <Folder className="mx-auto size-6 text-text-primary/35" strokeWidth={1.5} />
      <h2 className="mt-3 text-sm font-medium text-text-emphasis">
        {isNested ? 'This folder is empty' : 'Nothing here yet'}
      </h2>
      <p className="mt-1 text-xs text-text-primary/60">
        {isNested
          ? 'Add notes, folders, or a database to organize this folder.'
          : 'Create a database, folder, or note to get started.'}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <ActionButton icon={Table2} label="New database" onClick={onCreateDatabase} />
        <ActionButton icon={FolderPlus} label="New folder" onClick={onCreateFolder} />
        <ActionButton icon={FilePlus} label="New note" primary onClick={onCreateNote} />
      </div>
    </div>
  )
}
