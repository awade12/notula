import { MessageSquarePlus, MoreHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type PageAiPanelToolbarProps = {
  showHistory: boolean
  canDeleteActive: boolean
  onNewConversation: () => void
  onToggleHistory: () => void
  onDeleteActive: () => void
}

export function PageAiPanelToolbar({
  showHistory,
  canDeleteActive,
  onNewConversation,
  onToggleHistory,
  onDeleteActive,
}: PageAiPanelToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  return (
    <div className="flex items-center gap-1">
      <ToolbarButton label="New conversation" onClick={onNewConversation}>
        <MessageSquarePlus size={15} strokeWidth={1.75} aria-hidden />
      </ToolbarButton>

      <ToolbarButton
        label={showHistory ? 'Back to chat' : 'Past conversations'}
        onClick={onToggleHistory}
        isActive={showHistory}
      >
        <span className="text-[11px] font-medium tracking-wide">
          {showHistory ? 'Chat' : 'History'}
        </span>
      </ToolbarButton>

      <div ref={menuRef} className="relative">
        <ToolbarButton
          label="More options"
          onClick={() => setMenuOpen((open) => !open)}
          isActive={menuOpen}
        >
          <MoreHorizontal size={15} strokeWidth={1.75} aria-hidden />
        </ToolbarButton>

        {menuOpen ? (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[11rem] rounded-xl border border-border/70 bg-sidebar p-1 shadow-lg">
            <button
              type="button"
              disabled={!canDeleteActive}
              onClick={() => {
                setMenuOpen(false)
                onDeleteActive()
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors',
                canDeleteActive
                  ? 'text-red-300/90 hover:bg-white/[0.05]'
                  : 'cursor-not-allowed text-text-primary/25',
              )}
            >
              <Trash2 size={13} strokeWidth={1.75} aria-hidden />
              Delete conversation
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  isActive = false,
  children,
}: {
  label: string
  onClick: () => void
  isActive?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center justify-center rounded-lg px-2 text-text-primary/55 transition-colors hover:bg-white/[0.05] hover:text-text-primary/85',
        isActive && 'bg-white/[0.06] text-text-primary/85',
      )}
    >
      {children}
    </button>
  )
}
