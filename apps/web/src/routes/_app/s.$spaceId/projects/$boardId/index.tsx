import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ProjectBoardShell } from '@/features/projects/components/project-board-shell'

const projectBoardSearchSchema = z.object({
  task: z.string().optional(),
})

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/')({
  ssr: false,
  validateSearch: projectBoardSearchSchema,
  component: ProjectBoardRoute,
})

function ProjectBoardRoute() {
  const { spaceId, boardId } = Route.useParams()
  return <ProjectBoardShell spaceId={spaceId} boardId={boardId} />
}
