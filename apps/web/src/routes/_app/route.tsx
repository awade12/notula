import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { AppearanceProvider } from '@/features/settings/components/appearance-provider'
import { PreferencesSyncProvider } from '@/features/settings/components/preferences-sync-provider'
import { useToggleSidebarHotkey } from '@/features/settings/hooks/use-global-shortcuts'
import { getBootstrapSession } from '@/features/auth/lib/bootstrap-session'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const session = await getBootstrapSession()
    if (!session.user) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  useToggleSidebarHotkey()

  return (
    <AppearanceProvider>
      <PreferencesSyncProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </PreferencesSyncProvider>
    </AppearanceProvider>
  )
}
