import { dbRowHeight } from '@/features/database/lib/database-classes'
import { cn } from '@/lib/cn'

type TableSkeletonProps = {
  columns?: number
  rows?: number
}

export function TableSkeleton({ columns = 4, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="-mx-6 overflow-hidden">
      <div className="border-b border-white/8 px-2.5 py-2">
        <div className="flex gap-8">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-3 w-24 animate-pulse rounded bg-white/[0.06]"
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn('flex items-center gap-8 border-b border-white/[0.06] px-2.5', dbRowHeight)}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-3 w-full max-w-32 animate-pulse rounded bg-white/[0.04]"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
