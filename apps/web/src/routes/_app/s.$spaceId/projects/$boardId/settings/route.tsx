import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoardSettingsLayout } from '@/features/projects/components/project-board-settings-layout'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings')({
  ssr: false,
  component: ProjectBoardSettingsLayoutRoute,
})

function ProjectBoardSettingsLayoutRoute() {
  const { spaceId, boardId } = Route.useParams()
  return <ProjectBoardSettingsLayout spaceId={spaceId} boardId={boardId} />
}
