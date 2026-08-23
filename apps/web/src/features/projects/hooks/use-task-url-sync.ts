import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useProjectTaskUrlSync(spaceId: string, boardId: string) {
  const navigate = useNavigate()

  const openTask = useCallback(
    (taskId: string) => {
      void navigate({
        to: '/s/$spaceId/projects/$boardId',
        params: { spaceId, boardId },
        search: { task: taskId },
        replace: true,
      })
    },
    [boardId, navigate, spaceId],
  )

  const closeTask = useCallback(() => {
    void navigate({
      to: '/s/$spaceId/projects/$boardId',
      params: { spaceId, boardId },
      search: {},
      replace: true,
    })
  }, [boardId, navigate, spaceId])

  return { openTask, closeTask }
}
