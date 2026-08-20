import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { LayoutGrid, Settings } from 'lucide-react'
import { SidebarBlock } from '@/features/workspace/components/sidebar/sidebar-block'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { sidebarEmptyState, sidebarNewPageRow } from '@/features/workspace/lib/sidebar-classes'
import { addIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import { cn } from '@/lib/cn'
import {
  useCreateProjectBoard,
  useProjectBoards,
} from '../hooks/use-project-boards'
import { writeLastProjectBoardId } from '@/features/workspace/lib/workspace-mode'

type ProjectsSidebarProps = {
  spaceId: string
}

export function ProjectsSidebar({ spaceId }: ProjectsSidebarProps) {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const activeBoardId = 'boardId' in params ? params.boardId : undefined
  const { data: boards, isLoading } = useProjectBoards(spaceId)
  const createBoard = useCreateProjectBoard(spaceId)
  const canEdit = useCanEditSpace(spaceId)

  async function handleCreateBoard() {
    try {
      const result = await createBoard.mutateAsync({ title: 'Untitled board' })
      writeLastProjectBoardId(spaceId, result.database.id)
      await navigate({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId, boardId: result.database.id },
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create board')
    }
  }

  return (
    <SidebarBlock label="Boards" sticky className="pb-1">
      {canEdit ? (
        <button
          type="button"
          onClick={() => void handleCreateBoard()}
          disabled={createBoard.isPending}
          className={sidebarNewPageRow()}
        >
          <SidebarIcon icon={addIcon} strokeWidth={1.75} />
          {createBoard.isPending ? 'Creating…' : 'New board'}
        </button>
      ) : null}

      {isLoading ? (
        <div className="space-y-1 py-1">
          <div className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
      ) : boards && boards.length > 0 ? (
        <ul className="space-y-0.5 pb-2" aria-label="Project boards">
          {boards.map((board) => {
            const isActive = activeBoardId === board.id

            return (
              <li key={board.id} className="group/board relative">
                <Link
                  to="/s/$spaceId/projects/$boardId"
                  params={{ spaceId, boardId: board.id }}
                  onClick={() => writeLastProjectBoardId(spaceId, board.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-2 text-xs tracking-dashboard transition-colors',
                    isActive
                      ? 'bg-white/[0.1] font-medium text-text-inverse'
                      : 'text-text-inverse/62 hover:bg-white/[0.05] hover:text-text-inverse',
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                    {board.icon ? (
                      <PageIconDisplay value={board.icon} size={14} />
                    ) : (
                      <LayoutGrid className="size-3.5 text-text-inverse/55" strokeWidth={1.75} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{board.title}</span>
                </Link>
                {canEdit ? (
                  <Link
                    to="/s/$spaceId/projects/$boardId/settings/labels"
                    params={{ spaceId, boardId: board.id }}
                    aria-label={`Settings for ${board.title}`}
                    className={cn(
                      'absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-inverse/35 opacity-0 transition-opacity',
                      'hover:bg-white/[0.08] hover:text-text-inverse group-hover/board:opacity-100',
                      isActive && 'opacity-100',
                    )}
                  >
                    <Settings className="size-3.5" strokeWidth={1.75} />
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className={sidebarEmptyState()}>
          <p className="text-xs tracking-dashboard text-text-inverse/45">
            No boards yet. Create one to plan work in Kanban.
          </p>
        </div>
      )}
    </SidebarBlock>
  )
}
