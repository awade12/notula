import '@blocknote/mantine/style.css'
import '@/features/editor/styles/editor.css'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbarController,
  SideMenuController,
  SuggestionMenuController,
} from '@blocknote/react'
import { useCallback, useEffect } from 'react'
import { EditorWorkspaceProvider } from '@/features/editor/context/editor-workspace-context'
import { buildEditorTheme } from '@/features/editor/lib/editor-theme'
import { filterMentionMenuItems } from '@/features/editor/lib/get-mention-menu-items'
import { filterNotesSlashMenuItems } from '@/features/editor/lib/get-slash-menu-items'
import type { FlatPage } from '@/features/workspace/lib/build-tree'
import { NotesSideMenu } from '@/features/editor/components/side-menu/notes-side-menu'
import { useTaskDescriptionEditor } from '../hooks/use-task-description-editor'
import { ProjectTaskSelectionToolbar } from './project-task-selection-toolbar'

type ProjectTaskDescriptionEditorProps = {
  spaceId: string
  rowId: string
  value: unknown
  pages: FlatPage[]
  readOnly?: boolean
  onCommit: (value: string) => void
  onFocusReady?: (focus: () => void) => void
}

export function ProjectTaskDescriptionEditor({
  spaceId,
  rowId,
  value,
  pages,
  readOnly = false,
  onCommit,
  onFocusReady,
}: ProjectTaskDescriptionEditorProps) {
  const editor = useTaskDescriptionEditor({ rowId, value, readOnly, onCommit })
  const editorTheme = buildEditorTheme()

  useEffect(() => {
    onFocusReady?.(() => editor.focus())
  }, [editor, onFocusReady])

  const getSlashItems = useCallback(
    (query: string) => filterNotesSlashMenuItems(editor, query),
    [editor],
  )

  return (
    <EditorWorkspaceProvider spaceId={spaceId}>
      <div className="notes-editor-task-panel relative min-h-0 flex-1">
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme={{ light: editorTheme, dark: editorTheme }}
          className="notes-editor"
          spellCheck
          formattingToolbar={false}
          slashMenu={false}
          linkToolbar
          sideMenu={false}
          tableHandles
          comments={false}
        >
          {!readOnly ? (
            <>
              <FormattingToolbarController formattingToolbar={ProjectTaskSelectionToolbar} />
              <SideMenuController sideMenu={NotesSideMenu} />
              <SuggestionMenuController triggerCharacter="/" getItems={getSlashItems} />
              <SuggestionMenuController
                triggerCharacter="@"
                getItems={(query) => filterMentionMenuItems(editor, query, pages, spaceId, '')}
              />
            </>
          ) : null}
        </BlockNoteView>
      </div>
    </EditorWorkspaceProvider>
  )
}
