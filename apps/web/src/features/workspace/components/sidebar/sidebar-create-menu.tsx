import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import { SidebarAnchoredMenuPanel } from '@/features/workspace/components/sidebar/sidebar-anchored-menu-panel'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { sidebarSectionActionButton } from '@/features/workspace/lib/sidebar-classes'
import { sidebarMenuButtonTap } from '@/features/workspace/lib/sidebar-motion'
import {
  addIcon,
  databaseIcon,
  folderAddIcon,
  pageAddIcon,
} from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'

type SidebarCreateMenuProps = {
  onCreateDatabase?: () => void
  onCreateFolder: () => void
  onCreatePage: () => void
}

export function SidebarCreateMenu({
  onCreateDatabase,
  onCreateFolder,
  onCreatePage,
}: SidebarCreateMenuProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function run(action: () => void) {
    setIsOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        whileTap={prefersReducedMotion ? undefined : sidebarMenuButtonTap}
        className={cn(sidebarSectionActionButton(), isOpen && 'bg-white/[0.08] text-text-inverse/85')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Create"
        title="Create"
      >
        <SidebarIcon icon={addIcon} strokeWidth={2} />
      </motion.button>

      <SidebarAnchoredMenuPanel open={isOpen}>
        <SidebarContextMenuList>
          <SidebarContextMenuItem
            icon={pageAddIcon}
            label="New page"
            onClick={() => run(onCreatePage)}
          />
          <SidebarContextMenuItem
            icon={folderAddIcon}
            label="New folder"
            onClick={() => run(onCreateFolder)}
          />
          {onCreateDatabase ? (
            <SidebarContextMenuItem
              icon={databaseIcon}
              label="New database"
              onClick={() => run(onCreateDatabase)}
            />
          ) : null}
        </SidebarContextMenuList>
      </SidebarAnchoredMenuPanel>
    </div>
  )
}
