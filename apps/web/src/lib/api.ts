import { resolveClientApiUrl } from '@/lib/resolve-api-url'

export const apiUrl = resolveClientApiUrl()

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}
