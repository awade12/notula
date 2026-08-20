import { useRouterState } from '@tanstack/react-router'
import { workspaceModeFromPathname, type WorkspaceMode } from '../lib/workspace-mode'

export function useWorkspaceMode(): WorkspaceMode {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return workspaceModeFromPathname(pathname)
}
