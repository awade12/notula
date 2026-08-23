import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  insertMarkdownAtCursor,
  replacePageWithMarkdown,
  replaceSelectionWithMarkdown,
} from '@/features/editor/lib/insert-streamed-text'
import { normalizePageAiMarkdown } from './normalize-page-ai-markdown'
import type { PageAiApplyMode } from '../types/page-ai'

export function applyPageAiContent(
  editor: NotesEditor,
  markdown: string,
  applyMode: PageAiApplyMode,
) {
  const normalized = normalizePageAiMarkdown(markdown)
  if (!normalized) return

  switch (applyMode) {
    case 'replace-page':
      replacePageWithMarkdown(editor, normalized)
      return
    case 'replace-selection':
      replaceSelectionWithMarkdown(editor, normalized)
      return
    case 'insert':
      insertMarkdownAtCursor(editor, normalized)
  }
}
