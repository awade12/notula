import type { ReactNode } from 'react'
import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { taskCloseIcon } from '../lib/project-icon-pack'

type ProjectTaskPanelFrameProps = {
  boardTitle: string
  onClose: () => void
  children: ReactNode
}

export function ProjectTaskPanelFrame({ boardTitle, onClose, children }: ProjectTaskPanelFrameProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2">
        <p className="min-w-0 truncate text-[11px] text-text-primary/35">{boardTitle}</p>
        <button
          type="button"
          aria-label="Close task panel"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-text-primary/45 transition-colors hover:bg-white/[0.05] hover:text-text-primary"
        >
          <WorkspaceIcon icon={taskCloseIcon} size={iconSize.section} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  )
}
