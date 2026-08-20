import { LoadedPageIcon } from '@/features/workspace/components/loaded-page-icon'
import { getPageIconDefinition } from '@/features/workspace/lib/page-icon-registry'
import { parsePageIcon } from '@/features/workspace/lib/page-icon-value'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

type PageIconDisplayProps = {
  value: string | null | undefined
  size?: number
  className?: string
  fallback?: ReactNode
}

export function PageIconDisplay({
  value,
  size = iconSize.tree,
  className,
  fallback = null,
}: PageIconDisplayProps) {
  const parsed = parsePageIcon(value)

  if (!parsed) {
    return fallback ? <>{fallback}</> : null
  }

  if (parsed.kind === 'legacy') {
    return (
      <span
        className={cn('inline-flex items-center justify-center leading-none', className)}
        style={{ fontSize: Math.max(size - 2, 12) }}
        aria-hidden
      >
        {parsed.value}
      </span>
    )
  }

  const definition = getPageIconDefinition(parsed.id)
  if (!definition) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ color: parsed.color }}
      aria-hidden
    >
      <LoadedPageIcon iconName={definition.iconName} size={size} strokeWidth={1.75} />
    </span>
  )
}
