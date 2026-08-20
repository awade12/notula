import { motion, useReducedMotion } from 'framer-motion'
import {
  SidebarContextMenuItem,
  SidebarContextMenuList,
} from '@/features/workspace/components/sidebar/sidebar-context-menu-item'
import { SidebarFloatingMenuPanel } from '@/features/workspace/components/sidebar/sidebar-floating-menu-panel'
import { SidebarIcon } from '@/features/workspace/components/sidebar/sidebar-icon'
import { useSidebarFloatingMenu } from '@/features/workspace/hooks/use-sidebar-floating-menu'
import { sidebarMenuButtonTap } from '@/features/workspace/lib/sidebar-motion'
import { sidebarRowActionButton } from '@/features/workspace/lib/sidebar-classes'
import { addIcon, folderAddIcon, pageAddIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { cn } from '@/lib/cn'

type SidebarTreeAddMenuProps = {
  onAddPage: () => void
  onAddFolder: () => void
}

export function SidebarTreeAddMenu({ onAddPage, onAddFolder }: SidebarTreeAddMenuProps) {
  const prefersReducedMotion = useReducedMotion()
  const { anchorRef, menuRef, open, coords, toggle, close } = useSidebarFloatingMenu({
    menuWidth: 192,
    menuHeight: 112,
  })

  function run(action: () => void) {
    close()
    action()
  }

  return (
    <>
      <motion.button
        ref={anchorRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          toggle()
        }}
        whileTap={prefersReducedMotion ? undefined : sidebarMenuButtonTap}
        className={cn(sidebarRowActionButton(), open && 'bg-white/10 text-text-inverse')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Add to page"
      >
        <SidebarIcon icon={addIcon} strokeWidth={2} />
      </motion.button>

      <SidebarFloatingMenuPanel
        open={open}
        coords={coords}
        menuRef={menuRef}
        width={192}
      >
        <SidebarContextMenuList>
          <SidebarContextMenuItem
            icon={pageAddIcon}
            label="New page"
            onClick={() => run(onAddPage)}
          />
          <SidebarContextMenuItem
            icon={folderAddIcon}
            label="New folder"
            onClick={() => run(onAddFolder)}
          />
        </SidebarContextMenuList>
      </SidebarFloatingMenuPanel>
    </>
  )
}
