export type WorkspaceMode = 'notes' | 'projects'

export function isProjectsPathname(pathname: string) {
  return /\/s\/[^/]+\/projects(?:\/|$)/.test(pathname)
}

export function workspaceModeFromPathname(pathname: string): WorkspaceMode {
  return isProjectsPathname(pathname) ? 'projects' : 'notes'
}

export function lastProjectBoardKey(spaceId: string) {
  return `notesapp:last-project-board:${spaceId}`
}

export function readLastProjectBoardId(spaceId: string) {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(lastProjectBoardKey(spaceId))
  } catch {
    return null
  }
}

export function writeLastProjectBoardId(spaceId: string, boardId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(lastProjectBoardKey(spaceId), boardId)
  } catch {
    // Ignore storage failures.
  }
}
