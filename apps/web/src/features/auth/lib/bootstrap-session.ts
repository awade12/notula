import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { resolveServerApiUrl } from '@/lib/resolve-api-url'

export type BootstrapSession = {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  } | null
}

function getServerApiUrl() {
  return resolveServerApiUrl()
}

export const getBootstrapSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BootstrapSession> => {
    const request = getRequest()
    const cookie = request.headers.get('cookie') ?? ''

    const response = await fetch(`${getServerApiUrl()}/api/me`, {
      headers: { cookie },
    })

    if (!response.ok) {
      return { user: null }
    }

    const data = (await response.json()) as BootstrapSession
    return { user: data.user }
  },
)
