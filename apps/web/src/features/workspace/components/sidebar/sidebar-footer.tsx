import { getRouteApi, Link } from '@tanstack/react-router'
import { authClient } from '@/features/auth/lib/auth-client'
import { NotificationsBell } from '@/features/notifications/components/notifications-bell'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { sidebarItemClass } from '@/features/workspace/components/sidebar/sidebar-item'
import { sidebarDivider, sidebarMotionHover } from '@/features/workspace/lib/sidebar-classes'
import { logoutIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'

const appRoute = getRouteApi('/_app')

export function SidebarFooter() {
  const { user } = appRoute.useRouteContext()
  const initial = user.name.trim().slice(0, 1).toUpperCase() || '?'

  async function handleSignOut() {
    await authClient.signOut()
    window.location.assign('/login')
  }

  return (
    <div className="shrink-0">
      <div className={sidebarDivider()} />
      <div className="flex items-center gap-1 pt-2">
        <NotificationsBell />
        <Link
          to="/settings/profile"
          className={cn(sidebarItemClass(), 'min-w-0 flex-1 gap-2 px-1.5')}
          activeProps={{
            className: cn(sidebarItemClass({ active: true }), 'min-w-0 flex-1 gap-2 px-1.5'),
          }}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-meta font-medium text-text-inverse">
            {initial}
          </span>
          <span className="min-w-0 truncate">{user.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-text-inverse/35',
            sidebarMotionHover(),
            'hover:bg-white/[0.06] hover:text-text-inverse/75',
          )}
          aria-label="Sign out"
          title="Sign out"
        >
          <SidebarIcon icon={logoutIcon} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
