import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProjectBoardEmpty } from '@/features/projects/components/project-board-empty'
import { readLastProjectBoardId } from '@/features/workspace/lib/workspace-mode'

export const Route = createFileRoute('/_app/s/$spaceId/projects/')({
  ssr: false,
  beforeLoad: ({ params }) => {
    const lastBoardId = readLastProjectBoardId(params.spaceId)
    if (lastBoardId) {
      throw redirect({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId: params.spaceId, boardId: lastBoardId },
      })
    }
  },
  component: ProjectsIndexRoute,
})

function ProjectsIndexRoute() {
  const { spaceId } = Route.useParams()
  return <ProjectBoardEmpty spaceId={spaceId} />
}
