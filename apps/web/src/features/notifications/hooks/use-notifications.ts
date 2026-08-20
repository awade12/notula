import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type AppNotification = {
  id: string
  userId: string
  spaceId: string | null
  pageId: string | null
  type: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiFetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to load notifications')
      return (await response.json()) as {
        notifications: AppNotification[]
        unreadCount: number
      }
    },
    refetchInterval: 60_000,
  })
}

export function useNotificationActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed')
      return response.json()
    },
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/notifications/read-all', { method: 'POST' })
      if (!response.ok) throw new Error('Failed')
      return response.json()
    },
    onSuccess: invalidate,
  })

  return { markRead, markAllRead }
}

export async function notifyCommentParticipants(input: {
  spaceId: string
  pageId: string
  pageTitle: string
  recipientUserIds: string[]
}) {
  await apiFetch(`/api/spaces/${input.spaceId}/notifications/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageId: input.pageId,
      pageTitle: input.pageTitle,
      recipientUserIds: input.recipientUserIds,
    }),
  })
}
