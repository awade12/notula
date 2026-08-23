import { useComponentsContext } from '@blocknote/react'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorAiOptional } from '@/features/ai/context/editor-ai-context'
import { REWRITE_ACTIONS, TURN_INTO_ACTIONS } from '@/features/ai/lib/prompt-templates'
import { cn } from '@/lib/cn'

type MenuPosition = {
  top: number
  left: number
  minWidth: number
}

function measureMenuPosition(anchor: HTMLElement, estimatedHeight: number): MenuPosition {
  const rect = anchor.getBoundingClientRect()
  const minWidth = 168
  let left = rect.left
  const maxLeft = window.innerWidth - minWidth - 8
  if (left > maxLeft) left = Math.max(8, maxLeft)

  const preferredTop = rect.bottom + 6
  const top =
    preferredTop + estimatedHeight > window.innerHeight - 8
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : preferredTop

  return { top, left, minWidth }
}

export function SelectionAiMenu() {
  const ai = useEditorAiOptional()
  const Components = useComponentsContext()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const estimatedHeight =
    220 +
    (ai?.flags.continueWriting ? 36 : 0) +
    (ai?.flags.turnInto ? 36 + TURN_INTO_ACTIONS.length * 32 : 0)

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }

    function updatePosition() {
      const anchor = anchorRef.current
      if (!anchor) return
      setPosition(measureMenuPosition(anchor, estimatedHeight))
    }

    updatePosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [estimatedHeight, open])

  if (!ai || !Components || !ai.flags.rewriteSelection) return null

  const menu =
    open && position && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className={cn(
              'rounded-lg border border-border bg-sidebar p-1 shadow-lg',
            )}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              minWidth: position.minWidth,
              zIndex: 200,
            }}
          >
            {REWRITE_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={ai.isRunning}
                onClick={() => {
                  setOpen(false)
                  void ai.runRewrite(action.id)
                }}
                className={cn(
                  'flex w-full rounded-md px-2.5 py-1.5 text-left text-xs tracking-dashboard',
                  'text-text-primary hover:bg-white/[0.06] disabled:opacity-40',
                )}
              >
                {action.label}
              </button>
            ))}
            {ai.flags.continueWriting ? (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  disabled={ai.isRunning}
                  onClick={() => {
                    setOpen(false)
                    void ai.runContinue()
                  }}
                  className={cn(
                    'flex w-full items-center gap-1 rounded-md px-2.5 py-1.5 text-left text-xs',
                    'tracking-dashboard text-text-emphasis hover:bg-white/[0.06] disabled:opacity-40',
                  )}
                >
                  Continue
                  <ChevronDown size={12} className="rotate-[-90deg] opacity-50" aria-hidden />
                </button>
              </>
            ) : null}
            {ai.flags.turnInto ? (
              <>
                <div className="my-1 h-px bg-border" />
                <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-text-primary/35">
                  Turn into
                </p>
                {TURN_INTO_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={ai.isRunning}
                    onClick={() => {
                      setOpen(false)
                      void ai.runTurnInto(action.id)
                    }}
                    className={cn(
                      'flex w-full rounded-md px-2.5 py-1.5 text-left text-xs tracking-dashboard',
                      'text-text-primary hover:bg-white/[0.06] disabled:opacity-40',
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </>
            ) : null}
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={anchorRef} className="flex items-center">
      <Components.FormattingToolbar.Button
        mainTooltip="Rewrite with AI"
        onClick={() => setOpen((value) => !value)}
        isSelected={open}
        isDisabled={ai.isRunning}
      >
        {ai.isRunning ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Sparkles size={16} strokeWidth={1.75} aria-hidden />
        )}
      </Components.FormattingToolbar.Button>
      {menu}
    </div>
  )
}
