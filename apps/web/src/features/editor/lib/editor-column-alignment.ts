import type { EditorAlignment } from '@/features/settings/types'

export function editorColumnAlignmentClass(alignment: EditorAlignment): string {
  switch (alignment) {
    case 'left':
      return 'mr-auto ml-0'
    case 'right':
      return 'ml-auto mr-0'
    default:
      return 'mx-auto'
  }
}
