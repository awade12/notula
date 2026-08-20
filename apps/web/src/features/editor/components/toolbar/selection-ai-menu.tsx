import { useComponentsContext } from '@blocknote/react'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useEditorAiOptional } from '@/features/ai/context/editor-ai-context'
import { REWRITE_ACTIONS } from '@/features/ai/lib/prompt-templates'
import { cn } from '@/lib/cn'

export function SelectionAiMenu() {
  const ai = useEditorAiOptional()
  const Components = useComponentsContext()
  const [open, setOpen] = useState(false)

  if (!ai || !Components || !ai.flags.rewriteSelection) return null

  return (
    <div className="relative flex items-center">
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

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close AI menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute left-0 top-full z-50 mt-1 min-w-[168px] rounded-lg border border-border',
              'bg-sidebar p-1 shadow-lg',
            )}
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
          </div>
        </>
      ) : null}
    </div>
  )
}
