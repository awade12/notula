import { HugeiconsIcon } from '@hugeicons/react'
import { aiPanelIcon } from '../lib/ai-icons'
import { cn } from '@/lib/cn'

type AiPanelToggleProps = {
  open: boolean
  onToggle: () => void
}

export function AiPanelToggle({ open, onToggle }: AiPanelToggleProps) {
  return (
    <button
      type="button"
      aria-label={open ? 'Close AI panel' : 'Open AI panel'}
      aria-pressed={open}
      onClick={onToggle}
      className={cn(
        'flex h-9 w-10 items-center justify-center',
        'rounded-tr-[var(--radius-panel)] rounded-bl-[var(--radius-panel)] border-b border-l border-white/12',
        'transition-colors',
        open
          ? 'border-white/18 bg-sidebar text-text-emphasis'
          : 'bg-surface text-text-primary/70 hover:border-white/18 hover:bg-white/[0.04] hover:text-text-emphasis',
      )}
    >
      <HugeiconsIcon icon={aiPanelIcon} size={16} strokeWidth={1.75} aria-hidden />
    </button>
  )
}
