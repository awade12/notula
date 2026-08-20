const STORAGE_KEY = 'notesapp:sidebar-collapsed'
const CHROME_STORAGE_KEY = 'notesapp:sidebar-chrome-expanded'

let collapsed = false
let chromeExpanded = false
const listeners = new Set<() => void>()
const chromeListeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function emitChrome() {
  for (const listener of chromeListeners) {
    listener()
  }
}

function readCollapsed() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function readChromeExpanded() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(CHROME_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

if (typeof window !== 'undefined') {
  collapsed = readCollapsed()
  chromeExpanded = readChromeExpanded()
}

export function getSidebarCollapsed() {
  return collapsed
}

export function setSidebarCollapsed(next: boolean) {
  if (collapsed === next) return
  collapsed = next

  try {
    window.localStorage.setItem(STORAGE_KEY, String(next))
  } catch {
    // Browsing can continue when storage is unavailable.
  }

  emit()
}

export function toggleSidebarCollapsed() {
  setSidebarCollapsed(!collapsed)
}

export function subscribeSidebarCollapsed(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSidebarChromeExpanded() {
  return chromeExpanded
}

export function setSidebarChromeExpanded(next: boolean) {
  if (chromeExpanded === next) return
  chromeExpanded = next

  try {
    window.localStorage.setItem(CHROME_STORAGE_KEY, String(next))
  } catch {
    // Browsing can continue when storage is unavailable.
  }

  emitChrome()
}

export function toggleSidebarChromeExpanded() {
  setSidebarChromeExpanded(!chromeExpanded)
}

export function subscribeSidebarChromeExpanded(listener: () => void) {
  chromeListeners.add(listener)
  return () => chromeListeners.delete(listener)
}
