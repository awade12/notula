import type { ReactNode } from 'react'
import { editorColumnAlignmentClass } from '@/features/editor/lib/editor-column-alignment'
import { useAppearancePreferences } from '@/features/settings/hooks/use-appearance'
import { SlidePanelLayout } from '@/components/layout/slide-panel-layout'
import { cn } from '@/lib/cn'

type EditorWithAiPanelProps = {
  open: boolean
  panel: ReactNode
  toggle?: ReactNode
  children: ReactNode
}

export function EditorWithAiPanel({ open, panel, toggle, children }: EditorWithAiPanelProps) {
  const { editorAlignment } = useAppearancePreferences()

  return (
    <SlidePanelLayout
      open={open}
      panel={panel}
      toggle={toggle}
      contentClassName={cn(
        'max-w-[var(--editor-max-width,720px)]',
        editorColumnAlignmentClass(editorAlignment),
      )}
    >
      {children}
    </SlidePanelLayout>
  )
}
