import {
  BlockColorsItem,
  DragHandleMenu,
  RemoveBlockItem,
  TableColumnHeaderItem,
  TableRowHeaderItem,
} from '@blocknote/react'

export function NotesDragHandleMenu() {
  return (
    <DragHandleMenu>
      <RemoveBlockItem>Delete</RemoveBlockItem>
      <BlockColorsItem>Colors</BlockColorsItem>
      <TableRowHeaderItem>Header row</TableRowHeaderItem>
      <TableColumnHeaderItem>Header column</TableColumnHeaderItem>
    </DragHandleMenu>
  )
}
