import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { resolveServerApiUrl } from '@/lib/resolve-api-url'

export type AcceptSpaceInviteResult = {
  spaceId: string
  alreadyMember: boolean
}

export const acceptSpaceInvite = createServerFn({ method: 'POST' })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }): Promise<AcceptSpaceInviteResult> => {
    const request = getRequest()
    const cookie = request.headers.get('cookie') ?? ''

    const response = await fetch(
      `${resolveServerApiUrl()}/api/invites/${encodeURIComponent(data.token)}/accept`,
      {
        method: 'POST',
        headers: cookie ? { cookie } : {},
      },
    )

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(body?.error ?? 'Could not accept invite')
    }

    return (await response.json()) as AcceptSpaceInviteResult
  })
