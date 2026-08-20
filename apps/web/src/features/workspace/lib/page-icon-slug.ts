export function iconNameToSlug(iconName: string): string {
  const base = iconName.replace(/Icon$/, '')
  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

export function slugToIconName(slug: string): string {
  const name = slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return `${name}Icon`
}

export function iconNameToLabel(iconName: string): string {
  return iconName
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/(\d+)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isPageIconSlug(id: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 80
}
