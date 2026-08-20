import { ChevronRight, FileText, Folder } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import type { BreadcrumbItem } from '../lib/build-breadcrumbs'
import { isFolderKind } from '../types/page-kind'
import { cn } from '@/lib/cn'

type BreadcrumbsProps = {
  spaceId: string
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ spaceId, items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const label = (
          <span className="flex min-w-0 items-center gap-1.5">
            <BreadcrumbIcon item={item} />
            <span className="truncate">{item.title}</span>
          </span>
        )

        return (
          <span key={item.id ?? 'space-root'} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className="size-3 shrink-0 text-text-primary/30"
                strokeWidth={1.75}
                aria-hidden
              />
            ) : null}
            {isLast ? (
              <span className="min-w-0 text-sm font-medium text-text-emphasis">{label}</span>
            ) : item.id ? (
              <Link
                to="/s/$spaceId/p/$pageId"
                params={{ spaceId, pageId: item.id }}
                className={cn(
                  'min-w-0 text-sm text-text-primary/60 transition-colors hover:text-text-emphasis',
                )}
              >
                {label}
              </Link>
            ) : (
              <Link
                to="/s/$spaceId"
                params={{ spaceId }}
                className={cn(
                  'min-w-0 text-sm text-text-primary/60 transition-colors hover:text-text-emphasis',
                )}
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function BreadcrumbIcon({ item }: { item: BreadcrumbItem }) {
  if (item.icon) {
    return <PageIconDisplay value={item.icon} size={14} />
  }

  if (item.id && isFolderKind(item.kind)) {
    return <Folder className="size-3.5 shrink-0 text-text-primary/45" strokeWidth={1.75} aria-hidden />
  }

  if (item.id) {
    return <FileText className="size-3.5 shrink-0 text-text-primary/45" strokeWidth={1.75} aria-hidden />
  }

  return <Folder className="size-3.5 shrink-0 text-text-primary/45" strokeWidth={1.75} aria-hidden />
}
