import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ProjectPanelSelectMenuProps = {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function ProjectPanelSelectMenu({ children, footer, className }: ProjectPanelSelectMenuProps) {
  return (
    <div className={cn('flex flex-col py-1', className)}>
      <div className="flex flex-col gap-0.5 px-1">{children}</div>
      {footer ? (
        <>
          <div className="mx-2 my-1 border-t border-border/40" />
          <div className="px-1">{footer}</div>
        </>
      ) : null}
    </div>
  )
}

export function ProjectPanelSelectMenuDivider() {
  return <div className="mx-1 my-1 border-t border-border/40" />
}
