import { useState } from 'react'
import { authClient } from '../lib/auth-client'
import { cn } from '@/lib/cn'

export function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      if (mode === 'sign-up') {
        const result = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0] ?? 'User',
        })
        if (result.error) {
          setError(result.error.message ?? 'Sign up failed')
          return
        }
      } else {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) {
          setError(result.error.message ?? 'Sign in failed')
          return
        }
      }

      window.location.assign(redirectTo)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-2 text-2xl font-medium tracking-dashboard text-text-emphasis">
        {mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mb-8 text-sm tracking-dashboard text-text-primary">
        {mode === 'sign-in'
          ? 'Welcome back. Enter your details to continue.'
          : 'Create your account to get started.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-meta tracking-dashboard text-text-primary">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              'w-full rounded-lg border border-border bg-sidebar px-3 py-2',
              'text-sm tracking-dashboard text-text-emphasis outline-none',
              'focus:border-text-emphasis/40',
            )}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-meta tracking-dashboard text-text-primary">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              'w-full rounded-lg border border-border bg-sidebar px-3 py-2',
              'text-sm tracking-dashboard text-text-emphasis outline-none',
              'focus:border-text-emphasis/40',
            )}
          />
        </label>

        {error ? <p className="text-meta tracking-dashboard text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full rounded-lg bg-sidebar px-4 py-2.5',
            'text-sm font-medium tracking-dashboard text-text-inverse',
            'disabled:opacity-60',
          )}
        >
          {isPending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        className="mt-4 text-meta tracking-dashboard text-text-primary underline-offset-2 hover:underline"
      >
        {mode === 'sign-in'
          ? 'Need an account? Create one'
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
