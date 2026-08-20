import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/s/$spaceId')({
  component: SpaceLayoutRoute,
})

function SpaceLayoutRoute() {
  return <Outlet />
}
