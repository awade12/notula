export type SpaceRole = 'owner' | 'editor' | 'viewer'

export function normalizeSpaceRole(role: string): SpaceRole {
  if (role === 'owner') return 'owner'
  if (role === 'viewer') return 'viewer'
  return 'editor'
}

export function canManageMembers(role: SpaceRole) {
  return role === 'owner'
}

export function canEditSpace(role: SpaceRole) {
  return role === 'owner' || role === 'editor'
}

export const spaceRoleSchema = ['owner', 'editor', 'viewer'] as const
