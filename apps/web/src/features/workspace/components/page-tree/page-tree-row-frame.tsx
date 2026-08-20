import { pageTreeDepthPadding } from '@/features/workspace/lib/page-tree-layout'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

type PageTreeRowFrameProps = {
  depth: number
  children: ReactNode
  className?: string
}

export function PageTreeRowFrame({ depth, children, className }: PageTreeRowFrameProps) {
  return (
    <div className={cn('min-w-0', className)} style={pageTreeDepthPadding(depth)}>
      {children}
    </div>
  )
}
