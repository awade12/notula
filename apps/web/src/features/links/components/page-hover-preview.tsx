import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { usePagePreview } from '@/features/links/hooks/use-page-preview'
import { cn } from '@/lib/cn'

const PREVIEW_WIDTH = 256
const SHOW_DELAY_MS = 280
const HIDE_DELAY_MS = 150

type PageHoverPreviewProps = {
  spaceId: string
  pageId: string
  children: React.ReactNode
}

export function PageHoverPreview({ spaceId, pageId, children }: PageHoverPreviewProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [prefetch, setPrefetch] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' })
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: preview } = usePagePreview(spaceId, pageId, prefetch)

  const clearShowTimer = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
  }

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const updateCoords = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return

    const gap = 8
    const estimatedHeight = 120
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const placement =
      spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top'

    const top =
      placement === 'bottom' ? rect.bottom + gap : Math.max(gap, rect.top - gap - estimatedHeight)

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PREVIEW_WIDTH - 8))

    setCoords({ top, left, placement })
  }, [])

  const scheduleShow = () => {
    clearHideTimer()
    setPrefetch(true)
    clearShowTimer()
    showTimer.current = setTimeout(() => {
      updateCoords()
      setVisible(true)
    }, SHOW_DELAY_MS)
  }

  const scheduleHide = () => {
    clearShowTimer()
    clearHideTimer()
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setPrefetch(false)
    }, HIDE_DELAY_MS)
  }

  const keepOpen = () => {
    clearHideTimer()
  }

  useEffect(() => {
    return () => {
      clearShowTimer()
      clearHideTimer()
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)

    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [updateCoords, visible])

  const card =
    visible && typeof document !== 'undefined' ? (
      <div
        className={cn(
          'pointer-events-auto fixed z-[200] rounded-lg border border-border',
          'bg-surface p-3 shadow-lg',
          coords.placement === 'top' ? 'origin-bottom-left' : 'origin-top-left',
        )}
        style={{
          top: coords.top,
          left: coords.left,
          width: PREVIEW_WIDTH,
        }}
        onMouseEnter={keepOpen}
        onMouseLeave={scheduleHide}
      >
        <div className="flex items-start gap-2">
          <PageIconDisplay value={preview?.icon ?? null} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium tracking-dashboard text-text-emphasis">
              {preview?.title ?? 'Loading…'}
            </p>
            {preview?.snippet ? (
              <p className="mt-1 line-clamp-3 text-meta tracking-dashboard text-text-primary">
                {preview.snippet}
              </p>
            ) : null}
            {(preview?.openCommentCount ?? 0) > 0 ? (
              <p className="mt-2 flex items-center gap-1 text-meta tracking-dashboard text-text-primary">
                <MessageSquare size={12} />
                {preview?.openCommentCount} open{' '}
                {preview?.openCommentCount === 1 ? 'thread' : 'threads'}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    ) : null

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
      >
        {children}
      </span>
      {card ? createPortal(card, document.body) : null}
    </>
  )
}
