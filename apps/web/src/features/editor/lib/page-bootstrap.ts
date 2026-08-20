import { apiFetch } from '@/lib/api'

export type PageBootstrap = {
  title: string
  yjsState: string | null
}

export async function fetchPageBootstrap(spaceId: string, pageId: string) {
  const response = await apiFetch(`/api/spaces/${spaceId}/pages/${pageId}/bootstrap`)
  if (!response.ok) return null
  const data = (await response.json()) as { bootstrap: PageBootstrap }
  return data.bootstrap
}

export function base64ToUint8Array(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}
