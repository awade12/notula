import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export type BootstrapSession = {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  } | null
}

function getServerApiUrl(request: Request) {
  const configured = process.env.VITE_API_URL
  if (configured) return configured.replace(/\/$/, '')
  return new URL(request.url).origin
}

export const getBootstrapSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BootstrapSession> => {
    const request = getRequest()
    const cookie = request.headers.get('cookie') ?? ''

    const response = await fetch(`${getServerApiUrl(request)}/api/me`, {
      headers: { cookie },
    })

    if (!response.ok) {
      return { user: null }
    }

    const data = (await response.json()) as BootstrapSession
    return { user: data.user }
  },
)
