import { SideMenu } from '@blocknote/react'
import { NotesDragHandleMenu } from './notes-drag-handle-menu'

export function NotesSideMenu() {
  return <SideMenu dragHandleMenu={NotesDragHandleMenu} />
}
