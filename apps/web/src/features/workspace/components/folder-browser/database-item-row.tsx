import { Link } from '@tanstack/react-router'
import { Table2 } from 'lucide-react'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import type { DatabaseSummary } from '@/features/database/types'
import { cn } from '@/lib/cn'

type DatabaseItemRowProps = {
  spaceId: string
  item: DatabaseSummary
}

export function DatabaseItemRow({ spaceId, item }: DatabaseItemRowProps) {
  return (
    <li>
      <Link
        to="/s/$spaceId/db/$databaseId"
        params={{ spaceId, databaseId: item.id }}
        className={cn(
          'group flex items-center gap-3 rounded-xl border border-border bg-white/[0.018] px-4 py-3',
          'transition-colors hover:border-white/12 hover:bg-white/[0.035]',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          {item.icon ? (
            <PageIconDisplay value={item.icon} size={18} />
          ) : (
            <Table2 className="size-4 text-text-primary/55" strokeWidth={1.75} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-emphasis">
            {item.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-text-primary/50">Database</span>
        </span>
      </Link>
    </li>
  )
}
