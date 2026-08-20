import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

type IconProps = {
  icon: LucideIcon
  className?: string
  strokeWidth?: number
}

export function Icon({ icon: LucideIconComponent, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <LucideIconComponent
      className={cn('size-icon shrink-0', className)}
      strokeWidth={strokeWidth}
    />
  )
}
