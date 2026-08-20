import { filterSuggestionItems } from '@blocknote/core/extensions'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { FileText } from 'lucide-react'
import { PageIconDisplay } from '@/features/workspace/components/page-icon-display'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { NotesEditor } from './block-schema'

export function getMentionMenuItems(
  editor: NotesEditor,
  pages: FlatPage[],
  spaceId: string,
  currentPageId: string,
): DefaultReactSuggestionItem[] {
  return pages
    .filter((page) => page.id !== currentPageId)
    .map((page) => {
      const title = page.title.trim() || 'Untitled'

      return {
        title,
        subtext: 'Page',
        icon: page.icon ? (
          <PageIconDisplay value={page.icon} size={16} />
        ) : (
          <FileText size={18} strokeWidth={2} />
        ),
        onItemClick: () => {
          editor.insertInlineContent([
            {
              type: 'pageMention',
              props: {
                pageId: page.id,
                title,
                spaceId,
              },
            },
            ' ',
          ])
        },
      }
    })
}

export async function filterMentionMenuItems(
  editor: NotesEditor,
  query: string,
  pages: FlatPage[],
  spaceId: string,
  currentPageId: string,
): Promise<DefaultReactSuggestionItem[]> {
  return filterSuggestionItems(
    getMentionMenuItems(editor, pages, spaceId, currentPageId),
    query,
  )
}
