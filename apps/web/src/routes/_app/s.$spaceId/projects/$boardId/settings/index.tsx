import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/s/$spaceId/projects/$boardId/settings/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/s/$spaceId/projects/$boardId/settings/labels',
      params,
    })
  },
})
