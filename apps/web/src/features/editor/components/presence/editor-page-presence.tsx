import { useEffect, useState } from 'react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'
import { cn } from '@/lib/cn'

type PresenceUser = {
  id: string
  name: string
  color: string
}

type EditorPagePresenceProps = {
  provider: HocuspocusProvider | null
}

function readPresenceStates(provider: HocuspocusProvider): PresenceUser[] {
  const states = provider.awareness?.getStates()
  if (!states) return []

  const users: PresenceUser[] = []

  states.forEach((state) => {
    const user = state.user as { id?: string; name?: string; color?: string } | undefined
    if (!user?.id || !user.name) return
    users.push({
      id: user.id,
      name: user.name,
      color: user.color ?? '#6366f1',
    })
  })

  const unique = new Map<string, PresenceUser>()
  for (const user of users) {
    unique.set(user.id, user)
  }

  return [...unique.values()]
}

export function EditorPagePresence({ provider }: EditorPagePresenceProps) {
  const { showCollaboratorNames } = useUserPreferences()
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!provider?.awareness) return

    const awareness = provider.awareness
    if (!awareness) return

    const sync = () => setUsers(readPresenceStates(provider))
    sync()

    awareness.on('change', sync)
    return () => {
      awareness.off('change', sync)
    }
  }, [provider])

  if (users.length <= 1) return null

  const visible = users.slice(0, 5)
  const overflow = users.length - visible.length

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <span
            key={user.id}
            title={showCollaboratorNames ? user.name : undefined}
            className={cn(
              'flex size-7 items-center justify-center rounded-full border-2 border-sidebar',
              'text-[10px] font-medium text-white',
            )}
            style={{ backgroundColor: user.color }}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
      {showCollaboratorNames ? (
        <span className="text-meta tracking-dashboard text-text-primary">
          {visible.map((user) => user.name).join(', ')}
          {overflow > 0 ? ` +${overflow}` : ''}
        </span>
      ) : overflow > 0 ? (
        <span className="text-meta tracking-dashboard text-text-primary">+{overflow}</span>
      ) : null}
    </div>
  )
}
