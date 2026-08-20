import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptSpaceInvite } from '@/features/workspace/lib/accept-space-invite'
import { apiFetch } from '@/lib/api'

export type SpaceMember = {
  id: string
  userId: string
  role: string
  createdAt: string
  name: string
  email: string
  image: string | null
}

export type SpaceInvite = {
  id: string
  token: string
  role: string
  email: string | null
  expiresAt: string
  createdAt: string
}

export function useSpaceMembers(spaceId: string) {
  return useQuery({
    queryKey: ['space-members', spaceId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members`)
      if (!response.ok) throw new Error('Failed to load members')
      const data = (await response.json()) as { members: SpaceMember[] }
      return data.members
    },
  })
}

export function useSpaceInvites(spaceId: string) {
  return useQuery({
    queryKey: ['space-invites', spaceId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members/invites`)
      if (!response.ok) throw new Error('Failed to load invites')
      const data = (await response.json()) as { invites: SpaceInvite[] }
      return data.invites
    },
  })
}

export function useMemberActions(spaceId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] })
    void queryClient.invalidateQueries({ queryKey: ['space-invites', spaceId] })
  }

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) throw new Error('Failed to update role')
      return response.json()
    },
    onSuccess: invalidate,
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove member')
      return response.json()
    },
    onSuccess: invalidate,
  })

  const createInvite = useMutation({
    mutationFn: async (input: { role: 'editor' | 'viewer'; email?: string }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error('Failed to create invite')
      return (await response.json()) as SpaceInvite & { token: string }
    },
    onSuccess: invalidate,
  })

  const revokeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/members/invites/${inviteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to revoke invite')
      return response.json()
    },
    onSuccess: invalidate,
  })

  return { updateRole, removeMember, createInvite, revokeInvite }
}

export function buildInviteUrl(token: string) {
  if (typeof window === 'undefined') {
    return `/invite/${token}`
  }
  return `${window.location.origin}/invite/${token}`
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: async () => {
      const response = await apiFetch(`/api/invites/${token}`)
      if (!response.ok) throw new Error('Invite not found')
      const data = (await response.json()) as {
        invite: {
          spaceName: string
          role: string
          spaceId: string
          expiresAt: string
        }
      }
      return data.invite
    },
    enabled: token.length > 0,
  })
}

export function useAcceptInvite(token: string) {
  return useMutation({
    mutationFn: async () => acceptSpaceInvite({ data: { token } }),
  })
}
