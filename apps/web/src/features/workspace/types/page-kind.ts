export type PageKind = 'note' | 'folder'

export function isFolderKind(kind: string | undefined): kind is 'folder' {
  return kind === 'folder'
}
