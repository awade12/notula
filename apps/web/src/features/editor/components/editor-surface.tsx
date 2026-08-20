import '@blocknote/mantine/style.css'
import '../styles/editor.css'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbarController,
  SideMenuController,
  SuggestionMenuController,
} from '@blocknote/react'
import { useCallback, useEffect } from 'react'
import { useEditorAiOptional } from '@/features/ai/context/editor-ai-context'
import { useGhostCompletion } from '@/features/ai/hooks/use-ghost-completion'
import { mergeAiFeatureFlags } from '@/features/ai/lib/feature-flags'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { useAppearancePreferences } from '@/features/settings/hooks/use-appearance'
import type { NotesEditor } from '../lib/block-schema'
import { buildEditorTheme } from '../lib/editor-theme'
import { filterMentionMenuItems } from '../lib/get-mention-menu-items'
import { filterNotesSlashMenuItems } from '../lib/get-slash-menu-items'
import { CommentHoverController } from './comments/comment-hover-controller'
import { NotesCommentControllers } from './comments/notes-comment-controllers'
import { SelectionToolbar } from './toolbar/selection-toolbar'
import { NotesSideMenu } from './side-menu/notes-side-menu'
import { GhostCompletionInline } from './ghost-completion-inline'
type EditorSurfaceProps = {
  editor: NotesEditor
  spaceId: string
  pageId: string
  pages: FlatPage[]
  pageTitle: string
  canEdit?: boolean
}

export function EditorSurface({
  editor,
  spaceId,
  pageId,
  pages,
  pageTitle,
  canEdit = true,
}: EditorSurfaceProps) {
  const preferences = useAppearancePreferences()
  const editorTheme = buildEditorTheme()
  const ai = useEditorAiOptional()
  const { data: settings } = useAiSettings()
  const flags = mergeAiFeatureFlags(settings?.featureFlags)
  const ghostEnabled = canEdit && Boolean(settings?.hasApiKey) && flags.inlineGhostCompletion
  useGhostCompletion(editor, pageTitle, ghostEnabled)

  const slashAiOptions =
    ai && flags.slashCommands
      ? {
          enabled: true,
          onRun: (template: Parameters<typeof ai.runSlashAi>[0]) => {
            void ai.runSlashAi(template)
          },
        }
      : undefined

  const getSlashItems = useCallback(
    (query: string) => filterNotesSlashMenuItems(editor, query, slashAiOptions),
    [editor, slashAiOptions],
  )

  useEffect(() => {
    const root = document.querySelector('.notes-editor')
    if (!root) return

    const handleClick = (event: Event) => {
      if (!preferences.openLinksInNewTab) return
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor || !root.contains(anchor) || anchor.target === '_blank') return
      if (anchor.getAttribute('href')?.startsWith('#')) return

      event.preventDefault()
      window.open(anchor.href, '_blank', 'noopener,noreferrer')
    }

    root.addEventListener('click', handleClick)
    return () => root.removeEventListener('click', handleClick)
  }, [preferences.openLinksInNewTab])

  return (
    <div className="relative">
      <BlockNoteView
        editor={editor}
        editable={canEdit}
        theme={{ light: editorTheme, dark: editorTheme }}
        className="notes-editor"
        spellCheck={preferences.spellCheck}
        formattingToolbar={false}
        slashMenu={false}
        linkToolbar
        sideMenu={false}
        tableHandles
        comments={false}
      >
        {canEdit ? (
          <>
            <FormattingToolbarController formattingToolbar={SelectionToolbar} />
            <NotesCommentControllers spaceId={spaceId} pageId={pageId} pageTitle={pageTitle} />
            <CommentHoverController />
            <SideMenuController sideMenu={NotesSideMenu} />
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getSlashItems}
            />
            <SuggestionMenuController
              triggerCharacter="@"
              getItems={(query) => filterMentionMenuItems(editor, query, pages, spaceId, pageId)}
            />
          </>
        ) : (
          <>
            <NotesCommentControllers spaceId={spaceId} pageId={pageId} pageTitle={pageTitle} />
            <CommentHoverController />
          </>
        )}
      </BlockNoteView>
      {ghostEnabled ? <GhostCompletionInline editor={editor} /> : null}
    </div>
  )
}
