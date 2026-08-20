import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppBrandMark } from '@/features/auth/components/app-brand-mark'
import { LoginBrandPanel } from '@/features/auth/components/login-brand-panel'
import { LoginForm } from '@/features/auth/components/login-form'
import { getBootstrapSession } from '@/features/auth/lib/bootstrap-session'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getBootstrapSession()
    if (session.user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen overflow-auto">
      <aside className="hidden w-1/2 shrink-0 border-r border-border bg-sidebar lg:flex">
        <LoginBrandPanel />
      </aside>

      <main className="flex flex-1 items-center justify-center bg-surface px-main py-10">
        <div className="w-full max-w-sm">
          <AppBrandMark className="mb-8 lg:hidden" />
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
