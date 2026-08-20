import { useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import {
  taskCheckIcon,
  taskChevronDownIcon,
  taskLinkIcon,
  taskSearchIcon,
} from '../lib/project-icon-pack'
import { projectPanelFieldTrigger, projectPanelOption } from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'

type ProjectTaskDocumentationFieldProps = {
  spaceId: string
  value: unknown
  pages: FlatPage[]
  readOnly?: boolean
  onCommit: (value: unknown) => void
}

function resolveLinkedPageId(value: unknown) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export function ProjectTaskDocumentationField({
  spaceId,
  value,
  pages,
  readOnly = false,
  onCommit,
}: ProjectTaskDocumentationFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedId = resolveLinkedPageId(value)
  const selectedPage = selectedId ? pages.find((page) => page.id === selectedId) : undefined

  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return pages.slice(0, 50)
    return pages.filter((page) => page.title.toLowerCase().includes(normalized)).slice(0, 50)
  }, [pages, query])

  function openPicker() {
    if (readOnly) return
    setQuery('')
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="space-y-2">
      {selectedPage ? (
        <Link
          to="/s/$spaceId/p/$pageId"
          params={{ spaceId, pageId: selectedPage.id }}
          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/50 bg-white/[0.04] px-3 py-2 text-sm text-text-emphasis transition-colors hover:bg-white/[0.06]"
        >
          {selectedPage.icon ? <PageIconDisplay value={selectedPage.icon} size={14} /> : null}
          <WorkspaceIcon icon={taskLinkIcon} size={iconSize.section} />
          <span className="truncate">{selectedPage.title || 'Linked note'}</span>
        </Link>
      ) : null}

      {!readOnly ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={openPicker}
            className={cn(projectPanelFieldTrigger, !selectedPage && 'text-text-primary/40')}
          >
            <span className="truncate">{selectedPage ? 'Change linked note' : 'Link a note'}</span>
            <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} className="text-text-primary/40" />
          </button>

          <ProjectPanelPopover
            open={open}
            anchorRef={triggerRef}
            onClose={() => setOpen(false)}
            minWidth={300}
            className="overflow-hidden p-0"
          >
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
              <WorkspaceIcon icon={taskSearchIcon} size={iconSize.section} className="text-text-primary/45" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes…"
                className="min-w-0 flex-1 bg-transparent text-sm text-text-emphasis outline-none placeholder:text-text-primary/35"
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => {
                  onCommit([])
                  setOpen(false)
                }}
                className={projectPanelOption(!selectedId)}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {!selectedId ? <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} /> : null}
                </span>
                <span>No linked note</span>
              </button>

              {filteredPages.length === 0 ? (
                <p className="px-2 py-2 text-xs text-text-primary/45">No notes found</p>
              ) : (
                filteredPages.map((page) => {
                  const selected = selectedId === page.id
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        onCommit([page.id])
                        setOpen(false)
                      }}
                      className={projectPanelOption(selected)}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {selected ? <WorkspaceIcon icon={taskCheckIcon} size={iconSize.section} /> : null}
                      </span>
                      {page.icon ? <PageIconDisplay value={page.icon} size={14} /> : null}
                      <span className="min-w-0 flex-1 truncate">{page.title || 'Untitled'}</span>
                    </button>
                  )
                })
              )}
            </div>
          </ProjectPanelPopover>
        </>
      ) : !selectedPage ? (
        <p className="text-sm text-text-primary/35">No linked note</p>
      ) : null}
    </div>
  )
}
