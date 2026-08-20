import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { authClient } from '@/features/auth/lib/auth-client'
import { SettingsSection } from '@/features/settings/components/settings-section'
import { cn } from '@/lib/cn'

const appRoute = getRouteApi('/_app')

const fieldClass = cn(
  'w-full rounded-lg border border-border bg-sidebar px-3 py-2',
  'text-sm tracking-dashboard text-text-emphasis outline-none',
  'placeholder:text-text-primary/50 focus:border-white/20',
)

const labelClass = 'mb-1.5 block text-meta tracking-dashboard text-text-primary'

export function ProfileSettingsForm() {
  const { user } = appRoute.useRouteContext()
  const [name, setName] = useState(user.name)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsPending(true)

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      setIsPending(false)
      return
    }

    const result = await authClient.updateUser({ name: trimmed })

    if (result.error) {
      setError(result.error.message ?? 'Could not update profile')
      setIsPending(false)
      return
    }

    setMessage('Profile updated')
    setIsPending(false)
  }

  return (
    <SettingsSection
      title="Profile"
      description="How your name appears across Notula and in collaborative sessions."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <label className="block">
          <span className={labelClass}>Display name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            value={user.email}
            readOnly
            className={cn(fieldClass, 'cursor-not-allowed text-text-primary')}
          />
          <p className="mt-1.5 text-[10px] tracking-dashboard text-text-primary/60">
            Email changes are not available yet.
          </p>
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
            disabled={isPending || name.trim() === user.name}
            className={cn(
              'rounded-lg bg-white/10 px-4 py-2 text-sm font-medium tracking-dashboard',
              'text-text-emphasis transition-colors hover:bg-white/14',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </SettingsSection>
  )
}
