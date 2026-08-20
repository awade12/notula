import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId')({
  component: ProjectBoardLayoutRoute,
})

function ProjectBoardLayoutRoute() {
  return <Outlet />
}
