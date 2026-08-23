import { createPortal } from 'react-dom'
import { PageAiReplacePreview } from '@/features/ai/components/page-ai-replace-preview'
import { cn } from '@/lib/cn'
import type { EditorAiPreviewState } from '../types/editor-ai-preview'

type EditorAiPreviewOverlayProps = {
  preview: EditorAiPreviewState
  onConfirm: () => void
  onDiscard: () => void
}

export function EditorAiPreviewOverlay({
  preview,
  onConfirm,
  onDiscard,
}: EditorAiPreviewOverlayProps) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[210] flex justify-center px-4">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border/70',
          'bg-sidebar shadow-2xl shadow-black/40',
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-emphasis">Review AI changes</p>
            <p className="mt-0.5 text-[12px] text-text-primary/45">
              Nothing is written to the page until you approve.
            </p>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary/50 transition-colors hover:bg-white/[0.05] hover:text-text-emphasis"
          >
            Discard
          </button>
        </div>

        <div className="p-3">
          <PageAiReplacePreview
            before={preview.before}
            after={preview.after}
            applyLabel={preview.applyLabel}
            onConfirm={onConfirm}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
