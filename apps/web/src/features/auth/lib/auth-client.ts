import { createAuthClient } from 'better-auth/react'
import { getApiUrl } from '@/lib/api'

function resolveAuthBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return getApiUrl()
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  fetchOptions: {
    credentials: 'include',
  },
})

export type SessionUser = typeof authClient.$Infer.Session.user
