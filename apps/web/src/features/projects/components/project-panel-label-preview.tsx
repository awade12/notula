import { useLayoutEffect, useRef, useState } from 'react'
import type { SelectOption } from '@notesapp/shared'
import { cn } from '@/lib/cn'
import { ProjectPanelSelectPill } from './project-panel-select-pill'

type ProjectPanelLabelPreviewProps = {
  options: SelectOption[]
  className?: string
}

const LABEL_GAP = 4
const OVERFLOW_BADGE_WIDTH = 30

function measureOverflowBadge(count: number) {
  return Math.max(OVERFLOW_BADGE_WIDTH, 22 + String(count).length * 6)
}

function fitVisibleLabelCount(pillWidths: number[], availableWidth: number) {
  if (pillWidths.length === 0) return 0
  if (pillWidths.length === 1) return 1

  for (let visible = pillWidths.length; visible >= 1; visible -= 1) {
    const hidden = pillWidths.length - visible
    let used = 0

    for (let index = 0; index < visible; index += 1) {
      const pillWidth = pillWidths[index] ?? 0
      used += pillWidth
      if (index > 0) used += LABEL_GAP
    }

    if (hidden > 0) {
      used += LABEL_GAP + measureOverflowBadge(hidden)
    }

    if (used <= availableWidth) return visible
  }

  return 1
}

export function ProjectPanelLabelPreview({ options, className }: ProjectPanelLabelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(options.length)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    function updateVisibleCount() {
      const pills = [...measure.querySelectorAll<HTMLElement>('[data-label-pill]')]
      const widths = pills.map((pill) => pill.getBoundingClientRect().width)
      const next = fitVisibleLabelCount(widths, container.clientWidth)
      setVisibleCount((current) => (current === next ? current : next))
    }

    updateVisibleCount()

    const observer = new ResizeObserver(updateVisibleCount)
    observer.observe(container)

    return () => observer.disconnect()
  }, [options])

  if (options.length === 0) return null

  const hiddenCount = Math.max(0, options.length - visibleCount)
  const visibleOptions = options.slice(0, visibleCount)
  const hiddenOptions = options.slice(visibleCount)

  return (
    <>
      <div
        ref={containerRef}
        className={cn('flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1', className)}
      >
        {visibleOptions.map((option) => (
          <ProjectPanelSelectPill key={option.id} option={option} size="compact" />
        ))}
        {hiddenCount > 0 ? (
          <span
            title={hiddenOptions.map((option) => option.label).join(', ')}
            className="inline-flex shrink-0 items-center rounded-md bg-white/[0.06] px-1.5 py-px text-[11px] font-medium text-text-primary/55 ring-1 ring-inset ring-white/[0.06]"
          >
            +{hiddenCount}
          </span>
        ) : null}
      </div>

      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 flex gap-1 opacity-0"
      >
        {options.map((option) => (
          <span key={option.id} data-label-pill>
            <ProjectPanelSelectPill option={option} size="compact" />
          </span>
        ))}
      </div>
    </>
  )
}
