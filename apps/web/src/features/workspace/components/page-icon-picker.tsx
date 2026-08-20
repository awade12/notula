import { LoadedPageIcon } from '@/features/workspace/components/loaded-page-icon'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import {
  DEFAULT_PAGE_ICON_COLOR,
  PAGE_ICON_COLORS,
} from '@/features/workspace/lib/page-icon-colors'
import {
  PAGE_ICON_CATALOG,
} from '@/features/workspace/lib/page-icon-registry'
import {
  PAGE_ICON_LIBRARY_SIZE,
  searchPageIcons,
} from '@/features/workspace/lib/page-icon-search'
import {
  encodePageIcon,
  getPageIconDraft,
} from '@/features/workspace/lib/page-icon-value'
import { cancelIcon, smileIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type PageIconPickerProps = {
  value: string | null
  onSelect: (icon: string | null) => void
  trigger?: ReactNode
  align?: 'left' | 'right'
  variant?: 'sidebar' | 'surface'
}

export function PageIconPicker({
  value,
  onSelect,
  trigger,
  align = 'right',
  variant = 'sidebar',
}: PageIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [draftIconId, setDraftIconId] = useState<ReturnType<typeof getPageIconDraft>['iconId']>(null)
  const [draftColor, setDraftColor] = useState<string>(DEFAULT_PAGE_ICON_COLOR)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const draft = getPageIconDraft(value)
    setDraftIconId(draft.iconId)
    setDraftColor(draft.color)
    setQuery('')
  }, [open, value])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const isSurface = variant === 'surface'

  const visibleIcons = useMemo(() => {
    const trimmed = query.trim()
    if (trimmed) return searchPageIcons(trimmed)
    return PAGE_ICON_CATALOG.map((entry) => ({
      iconName: entry.iconName,
      slug: entry.id,
      label: entry.label,
    }))
  }, [query])

  function applySelection(iconId: NonNullable<ReturnType<typeof getPageIconDraft>['iconId']>, color: string) {
    onSelect(encodePageIcon(iconId, color))
  }

  function handleColorSelect(color: string) {
    setDraftColor(color)
    if (draftIconId) {
      applySelection(draftIconId, color)
    }
  }

  function handleIconSelect(slug: string) {
    setDraftIconId(slug)
    applySelection(slug, draftColor)
    setOpen(false)
  }

  const previewEncoded = draftIconId ? encodePageIcon(draftIconId, draftColor) : value

  return (
    <div ref={rootRef} className="relative shrink-0" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className={cn(
          trigger
            ? undefined
            : cn(
                'flex size-7 items-center justify-center rounded-md transition-colors',
                isSurface
                  ? 'text-text-primary/45 hover:bg-white/[0.06] hover:text-text-emphasis'
                  : 'text-text-inverse/45 hover:bg-white/10 hover:text-text-inverse',
              ),
        )}
        aria-label="Change icon"
        title="Change icon"
      >
        {trigger ?? (
          previewEncoded ? (
            <PageIconDisplay value={previewEncoded} size={iconSize.menu} />
          ) : (
            <WorkspaceIcon icon={smileIcon} size={iconSize.menu} strokeWidth={1.75} />
          )
        )}
      </button>

      {open ? (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 w-72 rounded-lg border p-2 shadow-lg',
            isSurface ? 'border-border bg-surface' : 'border-white/10 bg-sidebar',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <div
            className={cn(
              'mb-2 flex flex-wrap gap-1.5 border-b pb-2',
              isSurface ? 'border-border' : 'border-white/10',
            )}
          >
            {PAGE_ICON_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => handleColorSelect(color.value)}
                className={cn(
                  'flex size-6 items-center justify-center rounded-md transition-transform',
                  draftColor === color.value && 'ring-1 ring-white/30 ring-offset-1 ring-offset-transparent',
                )}
                aria-label={`Icon color ${color.id}`}
                title={color.id}
              >
                <span
                  className="size-4 rounded-full border border-white/10"
                  style={{ backgroundColor: color.value }}
                />
              </button>
            ))}
          </div>

          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${PAGE_ICON_LIBRARY_SIZE.toLocaleString()} icons…`}
            className={cn(
              'mb-2 w-full rounded-md border px-2 py-1.5 text-xs tracking-dashboard outline-none',
              isSurface
                ? 'border-border bg-white/[0.03] text-text-emphasis placeholder:text-text-primary/40 focus:border-white/20'
                : 'border-white/10 bg-white/[0.04] text-text-inverse placeholder:text-text-inverse/35 focus:border-white/20',
            )}
          />

          <div className="scrollbar-none max-h-56 overflow-y-auto">
            {visibleIcons.length === 0 ? (
              <p
                className={cn(
                  'px-1 py-6 text-center text-xs tracking-dashboard',
                  isSurface ? 'text-text-primary/45' : 'text-text-inverse/45',
                )}
              >
                No icons match that search.
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1">
                {visibleIcons.map((entry) => {
                  const isSelected = draftIconId === entry.slug
                  return (
                    <button
                      key={entry.iconName}
                      type="button"
                      onClick={() => handleIconSelect(entry.slug)}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md transition-colors',
                        isSurface ? 'hover:bg-white/[0.06]' : 'hover:bg-white/10',
                        isSelected && (isSurface ? 'bg-white/[0.08]' : 'bg-white/10'),
                      )}
                      aria-label={entry.label}
                      title={entry.label}
                      style={{ color: draftColor }}
                    >
                      <LoadedPageIcon iconName={entry.iconName} size={iconSize.menu} strokeWidth={1.75} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {!query.trim() ? (
            <p
              className={cn(
                'mt-2 px-1 text-[10px] tracking-dashboard',
                isSurface ? 'text-text-primary/35' : 'text-text-inverse/35',
              )}
            >
              Search to browse the full free stroke icon library.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onSelect(null)
              setOpen(false)
            }}
            className={cn(
              'mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5',
              'text-[11px] tracking-dashboard transition-colors',
              isSurface
                ? 'text-text-primary/60 hover:bg-white/[0.04] hover:text-text-emphasis'
                : 'text-text-inverse/50 hover:bg-white/5 hover:text-text-inverse',
            )}
          >
            <WorkspaceIcon icon={cancelIcon} size={12} strokeWidth={1.75} aria-hidden />
            Remove icon
          </button>
        </div>
      ) : null}
    </div>
  )
}
