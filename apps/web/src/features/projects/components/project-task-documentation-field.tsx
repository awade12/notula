import { useMemo, useRef, useState, type RefObject } from 'react'
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
import {
  projectPanelOption,
  projectPanelTriggerClass,
  type ProjectPanelFieldVariant,
} from '../lib/project-panel-classes'
import { ProjectPanelPopover } from './project-panel-popover'

type ProjectTaskDocumentationFieldProps = {
  spaceId: string
  value: unknown
  pages: FlatPage[]
  readOnly?: boolean
  variant?: ProjectPanelFieldVariant
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
  variant = 'field',
  onCommit,
}: ProjectTaskDocumentationFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedId = resolveLinkedPageId(value)
  const selectedPage = selectedId ? pages.find((page) => page.id === selectedId) : undefined
  const isInline = variant === 'inline'

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

  if (readOnly && !selectedPage) {
    return <span className="text-sm text-text-primary/35">No linked note</span>
  }

  if (readOnly && selectedPage) {
    return (
      <Link
        to="/s/$spaceId/p/$pageId"
        params={{ spaceId, pageId: selectedPage.id }}
        className="inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-text-emphasis transition-colors hover:bg-white/[0.06]"
      >
        {selectedPage.icon ? <PageIconDisplay value={selectedPage.icon} size={14} /> : null}
        <WorkspaceIcon icon={taskLinkIcon} size={iconSize.section} className="text-text-primary/45" />
        <span className="truncate">{selectedPage.title || 'Linked note'}</span>
      </Link>
    )
  }

  if (isInline && selectedPage) {
    return (
      <>
        <div className="flex max-w-full items-center justify-end gap-1">
          <Link
            to="/s/$spaceId/p/$pageId"
            params={{ spaceId, pageId: selectedPage.id }}
            className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-text-emphasis transition-colors hover:bg-white/[0.06]"
          >
            {selectedPage.icon ? <PageIconDisplay value={selectedPage.icon} size={14} /> : null}
            <span className="truncate">{selectedPage.title || 'Linked note'}</span>
          </Link>
          {!readOnly ? (
            <button
              ref={triggerRef}
              type="button"
              onClick={openPicker}
              aria-label="Change linked note"
              className="inline-flex shrink-0 items-center rounded-md p-1 text-text-primary/40 transition-colors hover:bg-white/[0.06] hover:text-text-primary/70"
            >
              <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} />
            </button>
          ) : null}
        </div>

        <DocumentationPickerPopover
          open={open}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
          query={query}
          setQuery={setQuery}
          inputRef={inputRef}
          selectedId={selectedId}
          filteredPages={filteredPages}
          onCommit={onCommit}
        />
      </>
    )
  }

  return (
    <>
      <div className={cn(isInline ? 'flex max-w-full flex-col items-end gap-1.5' : 'space-y-2')}>
        {selectedPage && !isInline ? (
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

        <button
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          className={cn(
            projectPanelTriggerClass(variant),
            variant === 'field' && 'w-full',
            !selectedPage && 'text-text-primary/40',
          )}
        >
          <span className="truncate">{selectedPage ? 'Change linked note' : 'Link a note'}</span>
          <WorkspaceIcon icon={taskChevronDownIcon} size={iconSize.section} className="text-text-primary/40" />
        </button>
      </div>

      <DocumentationPickerPopover
        open={open}
        triggerRef={triggerRef}
        onClose={() => setOpen(false)}
        query={query}
        setQuery={setQuery}
        inputRef={inputRef}
        selectedId={selectedId}
        filteredPages={filteredPages}
        onCommit={onCommit}
      />
    </>
  )
}

type DocumentationPickerPopoverProps = {
  open: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  query: string
  setQuery: (value: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  selectedId: string | null
  filteredPages: FlatPage[]
  onCommit: (value: unknown) => void
}

function DocumentationPickerPopover({
  open,
  triggerRef,
  onClose,
  query,
  setQuery,
  inputRef,
  selectedId,
  filteredPages,
  onCommit,
}: DocumentationPickerPopoverProps) {
  return (
    <ProjectPanelPopover
      open={open}
      anchorRef={triggerRef}
      onClose={onClose}
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
            onClose()
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
                  onClose()
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
  )
}
