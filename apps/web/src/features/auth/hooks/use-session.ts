import { authClient } from '../lib/auth-client'

export function useSession() {
  return authClient.useSession()
}

export function useRequireAuth() {
  const session = useSession()
  return {
    ...session,
    isAuthenticated: Boolean(session.data?.user),
  }
}
