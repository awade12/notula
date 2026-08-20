import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useNotificationActions,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications'
import { cn } from '@/lib/cn'

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const { markRead, markAllRead } = useNotificationActions()
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative flex size-8 items-center justify-center rounded-lg',
          'text-text-inverse/35 hover:bg-white/[0.06] hover:text-text-inverse/75',
        )}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm tracking-dashboard text-text-emphasis">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-meta tracking-dashboard text-text-primary hover:text-text-emphasis"
                onClick={() => void markAllRead.mutateAsync()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {(data?.notifications ?? []).length === 0 ? (
              <li className="px-3 py-4 text-meta tracking-dashboard text-text-primary">No notifications yet</li>
            ) : (
              data?.notifications.map((item) => (
                <li key={item.id} className="border-b border-border/60 last:border-0">
                  {item.spaceId && item.pageId ? (
                    <Link
                      to="/s/$spaceId/p/$pageId"
                      params={{ spaceId: item.spaceId, pageId: item.pageId }}
                      className={cn(
                        'block px-3 py-2.5 hover:bg-white/[0.03]',
                        !item.readAt && 'bg-white/[0.02]',
                      )}
                      onClick={() => {
                        if (!item.readAt) void markRead.mutateAsync(item.id)
                        setOpen(false)
                      }}
                    >
                      <p className="text-sm tracking-dashboard text-text-emphasis">{item.title}</p>
                      {item.body ? (
                        <p className="mt-0.5 text-meta tracking-dashboard text-text-primary">{item.body}</p>
                      ) : null}
                    </Link>
                  ) : (
                    <div className="px-3 py-2.5">
                      <p className="text-sm tracking-dashboard text-text-emphasis">{item.title}</p>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
