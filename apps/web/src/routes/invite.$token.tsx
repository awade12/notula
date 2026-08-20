import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AppBrandMark } from '@/features/auth/components/app-brand-mark'
import { LoginForm } from '@/features/auth/components/login-form'
import { getBootstrapSession } from '@/features/auth/lib/bootstrap-session'
import { useAcceptInvite, useInvitePreview } from '@/features/workspace/hooks/use-space-members'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/invite/$token')({
  loader: async () => {
    const session = await getBootstrapSession()
    return { session }
  },
  component: InviteAcceptPage,
})

function InviteAcceptPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const { session } = Route.useLoaderData()
  const { data: invite, isLoading, error } = useInvitePreview(token)
  const acceptInvite = useAcceptInvite(token)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  async function handleAccept() {
    setAcceptError(null)
    try {
      const result = await acceptInvite.mutateAsync()
      void navigate({ to: '/s/$spaceId', params: { spaceId: result.spaceId } })
    } catch {
      setAcceptError('Could not join this space')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sidebar">
        <p className="text-sm tracking-dashboard text-text-primary">Loading invite…</p>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex h-screen items-center justify-center bg-sidebar px-main">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-main text-center">
          <h1 className="text-lg font-medium tracking-dashboard text-text-emphasis">Invite expired</h1>
          <p className="mt-2 text-sm tracking-dashboard text-text-primary">
            This link is no longer valid.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-text-emphasis underline">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (!session.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-main py-10">
        <div className="w-full max-w-md space-y-6">
          <AppBrandMark showTagline={false} />
          <div className="rounded-xl border border-border bg-surface p-main text-center">
            <p className="text-meta tracking-dashboard text-text-primary">You&apos;re invited to</p>
            <h1 className="mt-1 text-xl font-medium tracking-dashboard text-text-emphasis">
              {invite.spaceName}
            </h1>
            <p className="mt-2 text-sm tracking-dashboard text-text-primary">
              Join as {invite.role}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-main">
            <LoginForm redirectTo={`/invite/${token}`} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-sidebar px-main">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-main text-center">
        <p className="text-meta tracking-dashboard text-text-primary">Join space</p>
        <h1 className="mt-1 text-xl font-medium tracking-dashboard text-text-emphasis">
          {invite.spaceName}
        </h1>
        <p className="mt-2 text-sm tracking-dashboard text-text-primary">
          You&apos;ll join as {invite.role}
        </p>
        {acceptError ? (
          <p className="mt-3 text-meta tracking-dashboard text-red-400">{acceptError}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleAccept()}
          disabled={acceptInvite.isPending}
          className={cn(
            'mt-6 w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium',
            'tracking-dashboard text-text-emphasis hover:bg-white/14 disabled:opacity-40',
          )}
        >
          {acceptInvite.isPending ? 'Joining…' : 'Accept invite'}
        </button>
      </div>
    </div>
  )
}
