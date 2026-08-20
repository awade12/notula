import { useCreateBlockNote, useEditorChange } from '@blocknote/react'
import { useEffect, useMemo, useRef } from 'react'
import { notesBlockSchema } from '@/features/editor/lib/block-schema'
import { editorDictionary, editorDomAttributes } from '@/features/editor/lib/editor-config'
import { inlineCardLineBreakExtension } from '@/features/editor/lib/inline-card-line-break-extension'
import { typographyShortcutsExtension } from '@/features/editor/lib/typography-shortcuts-extension'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  parseProjectTaskDescription,
  serializeProjectTaskDescription,
} from '../lib/project-task-description-content'

const taskDescriptionDictionary = {
  ...editorDictionary,
  placeholders: {
    ...editorDictionary.placeholders,
    default: "Add details, or type '/' for blocks",
    emptyDocument: "Add details, or type '/' for blocks",
  },
}

type UseTaskDescriptionEditorOptions = {
  rowId: string
  value: unknown
  readOnly?: boolean
  onCommit: (value: string) => void
}

export function useTaskDescriptionEditor({
  rowId,
  value,
  readOnly = false,
  onCommit,
}: UseTaskDescriptionEditorOptions) {
  const commitTimeoutRef = useRef<number | null>(null)
  const lastCommittedRef = useRef('')

  const initialContent = useMemo(() => parseProjectTaskDescription(value), [rowId])

  const editor = useCreateBlockNote(
    {
      schema: notesBlockSchema,
      dictionary: taskDescriptionDictionary,
      domAttributes: editorDomAttributes,
      animations: false,
      extensions: [inlineCardLineBreakExtension, typographyShortcutsExtension],
      initialContent,
    },
    [rowId],
  )

  useEffect(() => {
    lastCommittedRef.current = serializeProjectTaskDescription(
      parseProjectTaskDescription(value) ?? [],
    )
  }, [rowId])

  useEffect(() => {
    const nextBlocks = parseProjectTaskDescription(value) ?? []
    const nextSerialized = serializeProjectTaskDescription(nextBlocks)
    if (!nextSerialized || nextSerialized === lastCommittedRef.current) return

    const currentSerialized = serializeProjectTaskDescription(editor.document)
    if (currentSerialized === nextSerialized) {
      lastCommittedRef.current = nextSerialized
      return
    }

    lastCommittedRef.current = nextSerialized
    editor.replaceBlocks(editor.document, nextBlocks)
  }, [editor, value])

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) window.clearTimeout(commitTimeoutRef.current)
    }
  }, [])

  useEditorChange(() => {
    if (readOnly) return

    const serialized = serializeProjectTaskDescription(editor.document)
    if (serialized === lastCommittedRef.current) return

    if (commitTimeoutRef.current) window.clearTimeout(commitTimeoutRef.current)
    commitTimeoutRef.current = window.setTimeout(() => {
      lastCommittedRef.current = serialized
      onCommit(serialized)
    }, 400)
  }, editor)

  return editor as NotesEditor
}
