import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutGrid, Plus } from 'lucide-react'
import { useCanEditSpace } from '@/features/workspace/hooks/use-space-role'
import { useCreateProjectBoard } from '../hooks/use-project-boards'

type ProjectBoardEmptyProps = {
  spaceId: string
}

export function ProjectBoardEmpty({ spaceId }: ProjectBoardEmptyProps) {
  const navigate = useNavigate()
  const createBoard = useCreateProjectBoard(spaceId)
  const canEdit = useCanEditSpace(spaceId)

  async function handleCreate() {
    try {
      const result = await createBoard.mutateAsync({ title: 'Untitled board' })
      await navigate({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId, boardId: result.database.id },
      })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create board')
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/[0.04]">
        <LayoutGrid className="size-7 text-text-primary/45" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-semibold tracking-dashboard text-text-emphasis">
        Project management
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-text-primary/55">
        Plan work on Kanban boards here. Notes stay in Notes mode — link a page to a card when
        you need deeper context.
      </p>

      {canEdit ? (
        <button
          type="button"
          disabled={createBoard.isPending}
          onClick={() => void handleCreate()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2 text-sm font-medium text-text-emphasis transition-colors hover:bg-white/[0.12] disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {createBoard.isPending ? 'Creating…' : 'Create your first board'}
        </button>
      ) : null}

      <Link
        to="/s/$spaceId"
        params={{ spaceId }}
        className="mt-4 text-sm text-text-primary/50 underline-offset-2 hover:text-text-primary/75 hover:underline"
      >
        Back to Notes
      </Link>
    </div>
  )
}
