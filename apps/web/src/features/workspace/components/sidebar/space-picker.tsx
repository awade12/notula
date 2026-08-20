import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCreateSpace, useSpaces } from '../../hooks/use-spaces'
import { SidebarBlock } from '@/features/workspace/components/sidebar/sidebar-block'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import {
  sidebarEmptyState,
  sidebarRow,
  sidebarSectionActionButton,
} from '@/features/workspace/lib/sidebar-classes'
import { addIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'
import { SpaceAvatar } from './space-avatar'

export function SpacePicker() {
  const navigate = useNavigate()
  const { data: spaces, isLoading } = useSpaces()
  const createSpace = useCreateSpace()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    const space = await createSpace.mutateAsync(trimmed)
    setName('')
    setIsAdding(false)
    await navigate({ to: '/s/$spaceId', params: { spaceId: space.id } })
  }

  return (
    <SidebarBlock
      label="Teamspaces"
      className="flex min-h-0 flex-1 flex-col overflow-hidden pb-0"
      action={
        !isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={sidebarSectionActionButton()}
            aria-label="New teamspace"
            title="New teamspace"
          >
            <SidebarIcon icon={addIcon} strokeWidth={2} />
          </button>
        ) : null
      }
    >
      {isAdding ? (
        <form onSubmit={handleCreate} className="mb-2 px-0.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Teamspace name"
            className={cn(
              'w-full rounded-lg border border-border bg-white/[0.04] px-2.5 py-1.5',
              'text-xs tracking-dashboard text-text-inverse outline-none',
              'placeholder:text-text-inverse/40 focus:border-white/20',
            )}
          />
        </form>
      ) : null}

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 px-0.5">
            <div className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />
          </div>
        ) : spaces && spaces.length > 0 ? (
          <ul className="space-y-0.5 px-0.5">
            {spaces.map((space) => (
              <li key={space.id}>
                <button
                  type="button"
                  onClick={() => void navigate({ to: '/s/$spaceId', params: { spaceId: space.id } })}
                  className={sidebarRow(false)}
                >
                  <SpaceAvatar name={space.name} />
                  <span className="truncate">{space.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={sidebarEmptyState()}>
            <p className="text-xs tracking-dashboard text-text-inverse/45">No teamspaces yet</p>
          </div>
        )}
      </div>
    </SidebarBlock>
  )
}
