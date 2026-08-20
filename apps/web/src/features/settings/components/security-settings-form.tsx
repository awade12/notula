import { useState } from 'react'
import { authClient } from '@/features/auth/lib/auth-client'
import { ActiveSessionsPanel } from '@/features/settings/components/active-sessions-panel'
import { SettingsSection } from '@/features/settings/components/settings-section'
import { cn } from '@/lib/cn'

const fieldClass = cn(
  'w-full rounded-lg border border-border bg-sidebar px-3 py-2',
  'text-sm tracking-dashboard text-text-emphasis outline-none',
  'placeholder:text-text-primary/50 focus:border-white/20',
)

const labelClass = 'mb-1.5 block text-meta tracking-dashboard text-text-primary'

export function SecuritySettingsForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setIsPending(true)

    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    })

    if (result.error) {
      setError(result.error.message ?? 'Could not change password')
      setIsPending(false)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Password updated')
    setIsPending(false)
  }

  async function handleSignOut() {
    await authClient.signOut()
    window.location.assign('/login')
  }

  return (
    <div className="space-y-5">
      <SettingsSection
        title="Password"
        description="Use a strong password you do not reuse on other sites."
      >
        <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={fieldClass}
              autoComplete="current-password"
            />
          </label>

          <label className="block">
            <span className={labelClass}>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldClass}
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass}
              autoComplete="new-password"
            />
          </label>

          {error ? (
            <p className="text-meta tracking-dashboard text-red-400">{error}</p>
          ) : null}
          {message ? (
            <p className="text-meta tracking-dashboard text-emerald-400/90">{message}</p>
          ) : null}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending || !currentPassword || !newPassword}
              className={cn(
                'rounded-lg bg-white/10 px-4 py-2 text-sm font-medium tracking-dashboard',
                'text-text-emphasis transition-colors hover:bg-white/14',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              {isPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </SettingsSection>

      <ActiveSessionsPanel />

      <SettingsSection
        title="Sign out"
        description="Sign out on this device. Your pages stay saved in the cloud."
      >
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={cn(
            'rounded-lg border border-border px-4 py-2 text-sm tracking-dashboard',
            'text-text-primary transition-colors hover:border-white/15 hover:text-text-emphasis',
          )}
        >
          Sign out
        </button>
      </SettingsSection>
    </div>
  )
}
