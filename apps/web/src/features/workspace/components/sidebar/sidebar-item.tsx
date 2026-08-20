import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { sidebarMotionHover } from '@/features/workspace/lib/sidebar-classes'
import { cn } from '@/lib/cn'

export function sidebarItemClass({
  active = false,
  muted = false,
  disabled = false,
}: {
  active?: boolean
  muted?: boolean
  disabled?: boolean
} = {}) {
  return cn(
    'flex w-full min-h-9 items-center gap-2 rounded-lg px-2 text-xs tracking-dashboard',
    sidebarMotionHover(),
    disabled && 'pointer-events-none text-text-inverse/25',
    !disabled && muted && 'text-text-inverse/45 hover:bg-white/[0.04] hover:text-text-inverse/70',
    !disabled && !muted && 'text-text-inverse/70 hover:bg-white/[0.04] hover:text-text-inverse',
    active && 'bg-white/[0.08] font-medium text-text-inverse',
  )
}

type SidebarItemProps = ComponentPropsWithoutRef<'div'> & {
  active?: boolean
  muted?: boolean
  disabled?: boolean
  children: ReactNode
}

export function SidebarItem({
  active = false,
  muted = false,
  disabled = false,
  className,
  children,
  ...props
}: SidebarItemProps) {
  return (
    <div
      className={cn(sidebarItemClass({ active, muted, disabled }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
