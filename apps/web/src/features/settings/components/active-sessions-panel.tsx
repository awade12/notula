import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Monitor, Smartphone } from 'lucide-react'
import { authClient } from '@/features/auth/lib/auth-client'
import { SettingsSection } from '@/features/settings/components/settings-section'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/cn'

type AuthSession = {
  id: string
  token: string
  expiresAt: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

function sessionLabel(session: AuthSession) {
  const agent = session.userAgent?.toLowerCase() ?? ''
  if (agent.includes('mobile') || agent.includes('iphone') || agent.includes('android')) {
    return { icon: Smartphone, label: 'Mobile device' }
  }
  return { icon: Monitor, label: 'Desktop browser' }
}

export function ActiveSessionsPanel() {
  const queryClient = useQueryClient()
  const { data: currentSession } = authClient.useSession()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: async () => {
      const response = await apiFetch('/api/auth/list-sessions')
      if (!response.ok) throw new Error('Failed to load sessions')
      return (await response.json()) as AuthSession[]
    },
  })

  const revokeSession = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiFetch('/api/auth/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) throw new Error('Failed to revoke session')
      return response.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] })
    },
  })

  const revokeOthers = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/auth/revoke-other-sessions', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to revoke sessions')
      return response.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-sessions'] })
    },
  })

  return (
    <SettingsSection
      title="Active sessions"
      description="Devices where you're signed in. Revoke any session you don't recognize."
    >
      {isLoading ? (
        <p className="text-sm tracking-dashboard text-text-primary">Loading sessions…</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sessions.map((session) => {
            const { icon: Icon, label } = sessionLabel(session)
            const isCurrent = session.id === currentSession?.session.id

            return (
              <li key={session.id} className="flex items-center gap-3 px-3 py-3">
                <Icon size={16} className="shrink-0 text-text-primary" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm tracking-dashboard text-text-emphasis">
                    {label}
                    {isCurrent ? (
                      <span className="ml-2 text-meta text-emerald-400/90">This device</span>
                    ) : null}
                  </p>
                  <p className="truncate text-meta tracking-dashboard text-text-primary">
                    {session.ipAddress ?? 'Unknown IP'}
                    {session.userAgent ? ` · ${session.userAgent.slice(0, 48)}` : ''}
                  </p>
                </div>
                {!isCurrent ? (
                  <button
                    type="button"
                    className="text-meta tracking-dashboard text-text-primary hover:text-red-400"
                    onClick={() => void revokeSession.mutateAsync(session.token)}
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={revokeOthers.isPending || sessions.length <= 1}
        onClick={() => void revokeOthers.mutateAsync()}
        className={cn(
          'mt-4 rounded-lg border border-border px-4 py-2 text-sm tracking-dashboard',
          'text-text-primary transition-colors hover:border-white/15 hover:text-text-emphasis',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        {revokeOthers.isPending ? 'Revoking…' : 'Revoke all other sessions'}
      </button>
    </SettingsSection>
  )
}
