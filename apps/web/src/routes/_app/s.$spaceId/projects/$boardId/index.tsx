import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardShell } from '@/features/projects/components/project-board-shell'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/')({
  ssr: false,
  component: ProjectBoardRoute,
})

function ProjectBoardRoute() {
  const { spaceId, boardId } = Route.useParams()
  return <ProjectBoardShell spaceId={spaceId} boardId={boardId} />
}
