import { canEditSpace, normalizeSpaceRole, type SpaceRole } from '../lib/space-role'
import { useSpaces } from './use-spaces'

export function useSpaceRole(spaceId: string): SpaceRole | undefined {
  const { data: spaces } = useSpaces()
  const space = spaces?.find((item) => item.id === spaceId)
  return space ? normalizeSpaceRole(space.role) : undefined
}

export function useCanEditSpace(spaceId: string) {
  const role = useSpaceRole(spaceId)
  if (!role) return false
  return canEditSpace(role)
}
