import type { SelectOption } from '@notesapp/shared'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { cn } from '@/lib/cn'

type ProjectPanelSelectPillProps = {
  option: SelectOption
  size?: 'default' | 'compact'
  className?: string
}

export function ProjectPanelSelectPill({
  option,
  size = 'default',
  className,
}: ProjectPanelSelectPillProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-md font-medium ring-1 ring-inset ring-white/[0.06]',
        selectOptionClassName(option.color),
        size === 'compact' ? 'px-2 py-px text-[11px] tracking-dashboard' : 'px-2.5 py-0.5 text-xs',
        className,
      )}
    >
      {option.label}
    </span>
  )
}
