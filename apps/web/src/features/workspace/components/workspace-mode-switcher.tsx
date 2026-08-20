import { useNavigate, useParams } from '@tanstack/react-router'
import { LayoutGrid, NotebookPen } from 'lucide-react'
import { sidebarModeTab, sidebarModeTabs } from '@/features/workspace/lib/sidebar-classes'
import { readLastProjectBoardId, type WorkspaceMode } from '../lib/workspace-mode'
import { useWorkspaceMode } from '../hooks/use-workspace-mode'

type ModeOption = {
  id: WorkspaceMode
  label: string
  icon: typeof NotebookPen
}

const modes: ModeOption[] = [
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'projects', label: 'Projects', icon: LayoutGrid },
]

export function WorkspaceModeSwitcher() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const spaceId = 'spaceId' in params ? params.spaceId : undefined
  const activeMode = useWorkspaceMode()

  if (!spaceId) return null

  async function switchMode(mode: WorkspaceMode) {
    if (mode === activeMode || !spaceId) return

    if (mode === 'notes') {
      await navigate({ to: '/s/$spaceId', params: { spaceId } })
      return
    }

    const lastBoardId = readLastProjectBoardId(spaceId)
    if (lastBoardId) {
      await navigate({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId, boardId: lastBoardId },
      })
      return
    }

    await navigate({ to: '/s/$spaceId/projects', params: { spaceId } })
  }

  return (
    <div className={sidebarModeTabs()} role="tablist" aria-label="Workspace mode">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = activeMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => void switchMode(mode.id)}
            className={sidebarModeTab(isActive)}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
