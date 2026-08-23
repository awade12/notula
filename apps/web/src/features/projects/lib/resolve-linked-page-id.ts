export function resolveLinkedPageId(value: unknown) {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim() || null
  }
  return null
}
