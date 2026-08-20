import {
  FilePlus2,
  FileText,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { shouldConfirmDelete } from '@/features/settings/lib/confirm-action'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { PageIconPicker } from '@/features/workspace/components/page-icon-picker'
import {
  countDirectChildren,
  type FlatPage,
} from '@/features/workspace/lib/build-tree'
import { usePageActions } from '@/features/workspace/hooks/use-page-actions'
import { collectDescendantIdsFromFlat } from '@/features/workspace/lib/update-page-tree-cache'
import { isFolderKind } from '@/features/workspace/types/page-kind'
import { cn } from '@/lib/cn'

type FolderItemRowProps = {
  spaceId: string
  item: FlatPage
  flatPages: FlatPage[]
  activePageId?: string
}

export function FolderItemRow({
  spaceId,
  item,
  flatPages,
  activePageId,
}: FolderItemRowProps) {
  const navigate = useNavigate()
  const { rename, updateIcon, convertKind, remove, createSubPage } = usePageActions(spaceId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const menuRef = useRef<HTMLDivElement>(null)
  const isFolder = isFolderKind(item.kind)
  const childCount = countDirectChildren(flatPages, item.id)

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  async function commitRename() {
    const nextTitle = editTitle.trim() || (isFolder ? 'New folder' : 'Untitled')
    setIsEditing(false)
    if (nextTitle === item.title) return
    await rename.mutateAsync({ pageId: item.id, title: nextTitle })
  }

  function handleDelete() {
    const confirmed = shouldConfirmDelete(
      isFolder
        ? `Delete "${item.title}" and everything inside it?`
        : `Delete "${item.title}"?`,
    )
    if (!confirmed) return

    const deletedIds = collectDescendantIdsFromFlat(flatPages, item.id)
    const shouldLeavePage = Boolean(activePageId && deletedIds.includes(activePageId))

    if (shouldLeavePage) {
      void navigate({ to: '/s/$spaceId', params: { spaceId } })
    }

    remove.mutate(item.id, {
      onError: (error) => {
        window.alert(error instanceof Error ? error.message : 'Could not delete page')
      },
    })
  }

  async function handleConvert(kind: 'note' | 'folder') {
    if (kind === 'note' && childCount > 0) {
      window.alert('Move or delete items before converting to a note.')
      return
    }

    await convertKind.mutateAsync({ pageId: item.id, kind })
    if (activePageId === item.id) {
      await navigate({
        to: '/s/$spaceId/p/$pageId',
        params: { spaceId, pageId: item.id },
      })
    }
  }

  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-xl border border-border bg-white/[0.018] px-3 py-2',
          'transition-colors hover:border-white/12 hover:bg-white/[0.035]',
        )}
      >
        <PageIconPicker
          variant="surface"
          align="left"
          value={item.icon}
          onSelect={(icon) => void updateIcon.mutateAsync({ pageId: item.id, icon })}
          trigger={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10">
              {item.icon ? (
                <PageIconDisplay value={item.icon} size={18} />
              ) : isFolder ? (
                <FolderPlus className="size-4 text-text-primary/55" strokeWidth={1.75} />
              ) : (
                <FileText className="size-4 text-text-primary/55" strokeWidth={1.75} />
              )}
            </span>
          }
        />

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void commitRename()
              if (event.key === 'Escape') {
                setEditTitle(item.title)
                setIsEditing(false)
              }
            }}
            className="min-w-0 flex-1 rounded-md bg-white/[0.06] px-2 py-1 text-sm text-text-emphasis outline-none"
          />
        ) : (
          <Link
            to="/s/$spaceId/p/$pageId"
            params={{ spaceId, pageId: item.id }}
            className="min-w-0 flex-1 py-1"
          >
            <span className="block truncate text-sm font-medium text-text-emphasis">
              {item.title}
            </span>
            <span className="mt-0.5 block text-[11px] text-text-primary/50">
              {isFolder
                ? childCount === 1
                  ? '1 item'
                  : `${childCount} items`
                : 'Note'}
            </span>
          </Link>
        )}

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              'flex size-8 items-center justify-center rounded-md text-text-primary/45',
              'opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-text-emphasis',
              'group-hover:opacity-100 focus-visible:opacity-100',
              menuOpen && 'bg-white/[0.06] text-text-emphasis opacity-100',
            )}
            aria-label="Item actions"
          >
            <MoreHorizontal className="size-4" strokeWidth={1.75} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-md border border-border bg-surface py-1 shadow-lg">
              <MenuButton
                icon={Pencil}
                label="Rename"
                onClick={() => {
                  setMenuOpen(false)
                  setEditTitle(item.title)
                  setIsEditing(true)
                }}
              />
              <MenuButton
                icon={FilePlus2}
                label="Add sub-page"
                onClick={() => {
                  setMenuOpen(false)
                  void createSubPage.mutateAsync({ parentId: item.id, kind: 'note' }).then((page) =>
                    navigate({
                      to: '/s/$spaceId/p/$pageId',
                      params: { spaceId, pageId: page.id },
                    }),
                  )
                }}
              />
              {isFolder ? (
                <MenuButton
                  icon={FolderPlus}
                  label="Add sub-folder"
                  onClick={() => {
                    setMenuOpen(false)
                    void createSubPage
                      .mutateAsync({
                        parentId: item.id,
                        kind: 'folder',
                        title: 'New folder',
                      })
                      .then((page) =>
                        navigate({
                          to: '/s/$spaceId/p/$pageId',
                          params: { spaceId, pageId: page.id },
                        }),
                      )
                  }}
                />
              ) : null}
              {isFolder ? (
                <MenuButton
                  icon={FileText}
                  label="Turn into note"
                  onClick={() => {
                    setMenuOpen(false)
                    void handleConvert('note')
                  }}
                />
              ) : (
                <MenuButton
                  icon={FolderInput}
                  label="Turn into folder"
                  onClick={() => {
                    setMenuOpen(false)
                    void handleConvert('folder')
                  }}
                />
              )}
              <MenuButton
                icon={Trash2}
                label="Delete"
                destructive
                onClick={() => {
                  setMenuOpen(false)
                  void handleDelete()
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs tracking-dashboard',
        destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-text-primary/70 hover:bg-white/[0.04] hover:text-text-emphasis',
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  )
}
