import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Settings, Users } from 'lucide-react'
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { SidebarAnchoredMenuPanel } from '@/features/workspace/components/sidebar/sidebar-anchored-menu-panel'
import {
  SidebarContextMenuDivider,
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import { sidebarItemClass } from '@/features/workspace/components/sidebar/sidebar-item'
import { useCreateSpace, useSpaces } from '../../hooks/use-spaces'
import { readLastProjectBoardId, workspaceModeFromPathname } from '../../lib/workspace-mode'
import {
  sidebarMenuItemSpring,
  sidebarMenuItemVariants,
} from '@/features/workspace/lib/sidebar-motion'
import { sidebarWorkspaceRow } from '@/features/workspace/lib/sidebar-classes'
import { addIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { cn } from '@/lib/cn'
import { SpaceAvatar } from './space-avatar'

export function SpaceSwitcher() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const activeSpaceId = 'spaceId' in params ? params.spaceId : undefined
  const activeBoardId = 'boardId' in params ? params.boardId : undefined
  const { data: spaces, isLoading } = useSpaces()
  const createSpace = useCreateSpace()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const activeSpace = spaces?.find((space) => space.id === activeSpaceId)
  const displayName =
    activeSpace?.name ??
    (isLoading && activeSpaceId ? '…' : activeSpaceId ? 'Teamspace' : 'Select a space')

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setIsAdding(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    const space = await createSpace.mutateAsync(trimmed)
    setName('')
    setIsAdding(false)
    setIsOpen(false)
    await navigate({ to: '/s/$spaceId', params: { spaceId: space.id } })
  }

  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const workspaceMode = workspaceModeFromPathname(pathname)

  function navigateSpaceHome(spaceId: string) {
    if (workspaceMode === 'projects') {
      const lastBoardId = readLastProjectBoardId(spaceId)
      if (lastBoardId) {
        void navigate({
          to: '/s/$spaceId/projects/$boardId',
          params: { spaceId, boardId: lastBoardId },
        })
        return
      }
      void navigate({ to: '/s/$spaceId/projects', params: { spaceId } })
      return
    }

    void navigate({ to: '/s/$spaceId', params: { spaceId } })
  }

  function handleRowClick() {
    setIsOpen((current) => !current)
  }

  const itemTransition = prefersReducedMotion ? { duration: 0 } : sidebarMenuItemSpring

  return (
    <div ref={rootRef} className="relative">
      <div className={sidebarWorkspaceRow(isOpen)}>
        <button
          type="button"
          onClick={handleRowClick}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Switch teamspace"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {activeSpace ? (
            <SpaceAvatar name={activeSpace.name} className="size-7 rounded-md" />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-medium text-text-inverse">
              ?
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-medium text-text-inverse">{displayName}</span>
        </button>
      </div>

      <SidebarAnchoredMenuPanel open={isOpen}>
        {isLoading ? (
          <p className="px-2 py-2 text-xs tracking-dashboard text-text-inverse/50">Loading…</p>
        ) : spaces && spaces.length > 0 ? (
          <SidebarContextMenuList>
            <ul className="scrollbar-none max-h-48 overflow-y-auto">
              {spaces.map((space) => (
                <li key={space.id}>
                  <motion.button
                    type="button"
                    role="menuitem"
                    variants={sidebarMenuItemVariants}
                    transition={itemTransition}
                    onClick={() => {
                      setIsOpen(false)
                      navigateSpaceHome(space.id)
                    }}
                    className={sidebarItemClass({ active: space.id === activeSpaceId })}
                  >
                    <SpaceAvatar name={space.name} />
                    <span className="truncate">{space.name}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </SidebarContextMenuList>
        ) : (
          <p className="px-2 py-2 text-xs tracking-dashboard text-text-inverse/50">No teamspaces yet</p>
        )}

        {activeSpaceId ? (
          <>
            <SidebarContextMenuDivider />
            <motion.button
              type="button"
              role="menuitem"
              variants={sidebarMenuItemVariants}
              transition={itemTransition}
              onClick={() => {
                setIsOpen(false)
                void navigate({
                  to: '/s/$spaceId/settings/members',
                  params: { spaceId: activeSpaceId },
                })
              }}
              className={sidebarItemClass()}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-text-inverse/55">
                <Users size={iconSize.menu} strokeWidth={1.75} />
              </span>
              <span className="truncate">Members & invites</span>
            </motion.button>
            {workspaceMode === 'projects' && activeBoardId ? (
              <motion.button
                type="button"
                role="menuitem"
                variants={sidebarMenuItemVariants}
                transition={itemTransition}
                onClick={() => {
                  setIsOpen(false)
                  void navigate({
                    to: '/s/$spaceId/projects/$boardId/settings/labels',
                    params: { spaceId: activeSpaceId, boardId: activeBoardId },
                  })
                }}
                className={sidebarItemClass()}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-text-inverse/55">
                  <Settings size={iconSize.menu} strokeWidth={1.75} />
                </span>
                <span className="truncate">Board settings</span>
              </motion.button>
            ) : null}
          </>
        ) : null}

        <SidebarContextMenuDivider />

        {isAdding ? (
          <form onSubmit={handleCreate} className="p-1">
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
        ) : (
          <SidebarContextMenuItem
            icon={addIcon}
            label="New teamspace"
            onClick={() => setIsAdding(true)}
          />
        )}
      </SidebarAnchoredMenuPanel>
    </div>
  )
}
