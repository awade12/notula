import { createAuthClient } from 'better-auth/react'
import { apiUrl } from '@/lib/api'

export const authClient = createAuthClient({
  baseURL: apiUrl,
})

export type SessionUser = typeof authClient.$Infer.Session.user
