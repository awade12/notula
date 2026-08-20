import { createFileRoute } from '@tanstack/react-router'
import { PublicProjectBoardShell } from '@/features/projects/components/public-project-board-shell'
import { usePublicBoard } from '@/features/projects/hooks/use-public-board'

export const Route = createFileRoute('/p/$boardSlug')({
  component: PublicBoardPage,
})

function PublicBoardPage() {
  const { boardSlug } = Route.useParams()
  const { data, isLoading, error } = usePublicBoard(boardSlug)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <p className="text-sm tracking-dashboard text-text-primary/55">Loading board…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-6">
        <div className="text-center">
          <h1 className="text-lg font-medium tracking-dashboard text-text-emphasis">Board not found</h1>
          <p className="mt-2 text-sm tracking-dashboard text-text-primary/55">
            This public board does not exist or is no longer published.
          </p>
        </div>
      </div>
    )
  }

  return <PublicProjectBoardShell payload={data} />
}
