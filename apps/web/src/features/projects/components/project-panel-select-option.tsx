import type { SelectOption } from '@notesapp/shared'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ProjectPanelSelectPill } from './project-panel-select-pill'

type ProjectPanelSelectOptionProps = {
  label: string
  selected: boolean
  option?: SelectOption
  mode?: 'single' | 'multi'
  onSelect: () => void
}

export function ProjectPanelSelectOption({
  label,
  selected,
  option,
  mode = 'single',
  onSelect,
}: ProjectPanelSelectOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
        'hover:bg-white/[0.04] active:bg-white/[0.07]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15',
        selected && 'bg-white/[0.03]',
      )}
    >
      <span className="flex min-w-0 flex-1 items-center">
        {option ? (
          <ProjectPanelSelectPill option={option} className="max-w-full" />
        ) : (
          <span className="text-xs text-text-primary/45">{label}</span>
        )}
      </span>
      {mode === 'multi' ? (
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
            selected
              ? 'border-white/25 bg-white/15 text-text-emphasis'
              : 'border-white/10 bg-transparent text-transparent',
          )}
        >
          {selected ? <Check className="size-2.5" strokeWidth={2.5} /> : null}
        </span>
      ) : selected ? (
        <Check className="size-3.5 shrink-0 text-text-primary/55" strokeWidth={2} />
      ) : (
        <span className="size-3.5 shrink-0" />
      )}
    </button>
  )
}
