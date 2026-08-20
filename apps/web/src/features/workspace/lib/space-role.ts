export type SpaceRole = 'owner' | 'editor' | 'viewer'

export function normalizeSpaceRole(role: string): SpaceRole {
  if (role === 'owner') return 'owner'
  if (role === 'viewer') return 'viewer'
  return 'editor'
}

export function canEditSpace(role: SpaceRole) {
  return role === 'owner' || role === 'editor'
}

export function canManageMembers(role: SpaceRole) {
  return role === 'owner'
}
