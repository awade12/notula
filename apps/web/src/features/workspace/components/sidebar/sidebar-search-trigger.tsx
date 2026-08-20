import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { sidebarKbd, sidebarSearchField } from '@/features/workspace/lib/sidebar-classes'
import { cn } from '@/lib/cn'
import { searchIcon } from '@/features/workspace/lib/workspace-icon-pack'

type SidebarSearchTriggerProps = {
  disabled?: boolean
  placeholder?: string
  onClick: () => void
}

export function SidebarSearchTrigger({
  disabled = false,
  placeholder = 'Search',
  onClick,
}: SidebarSearchTriggerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={sidebarSearchField(disabled)}
    >
      <SidebarIcon
        icon={searchIcon}
        strokeWidth={1.75}
        className={disabled ? 'text-text-inverse/25' : 'text-text-inverse/40'}
      />
      <span className={cn('min-w-0 flex-1 truncate', disabled && 'text-text-inverse/25')}>
        {placeholder}
      </span>
      {!disabled ? <kbd className={sidebarKbd()}>⌘K</kbd> : null}
    </button>
  )
}
