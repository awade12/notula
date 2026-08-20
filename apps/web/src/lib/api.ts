import { resolveClientApiUrl } from '@/lib/resolve-api-url'

export const apiUrl = resolveClientApiUrl()

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
}
