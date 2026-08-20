export type ParsedHotkey = {
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
  key: string
}

export function parseHotkey(binding: string): ParsedHotkey | null {
  if (binding === 'none') return null

  const parts = binding.toLowerCase().split('+')
  const key = parts[parts.length - 1] ?? ''
  return {
    meta: parts.includes('mod') || parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key,
  }
}

export function formatHotkeyLabel(binding: string) {
  if (binding === 'none') return 'Disabled'

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

  return binding
    .split('+')
    .map((part) => {
      if (part === 'mod') return isMac ? '⌘' : 'Ctrl'
      if (part === 'shift') return isMac ? '⇧' : 'Shift'
      if (part === 'alt') return isMac ? '⌥' : 'Alt'
      return part.length === 1 ? part.toUpperCase() : part
    })
    .join(isMac ? '' : '+')
}

export function matchesHotkey(event: KeyboardEvent, binding: string) {
  const parsed = parseHotkey(binding)
  if (!parsed) return false

  const modPressed = event.metaKey || event.ctrlKey
  const expectsMod = parsed.meta || parsed.ctrl

  if (expectsMod !== modPressed) return false
  if (parsed.shift !== event.shiftKey) return false
  if (parsed.alt !== event.altKey) return false

  return event.key.toLowerCase() === parsed.key
}

export function bindHotkey(binding: string, handler: () => void) {
  function onKeyDown(event: KeyboardEvent) {
    if (!matchesHotkey(event, binding)) return
    event.preventDefault()
    handler()
  }

  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}
