import type { Context, Next } from 'hono'
import { canEditSpace, normalizeSpaceRole } from '../modules/spaces/roles'
import type { SpaceVariables } from './require-space-member'

export function createRequireSpaceEditor() {
  return async (c: Context<{ Variables: SpaceVariables }>, next: Next) => {
    const role = normalizeSpaceRole(c.get('memberRole'))
    if (!canEditSpace(role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    return next()
  }
}
