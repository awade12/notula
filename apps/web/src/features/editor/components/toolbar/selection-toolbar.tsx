import {
  AddCommentButton,
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  type FormattingToolbarProps,
  TextAlignButton,
} from '@blocknote/react'
import { SelectionAiMenu } from './selection-ai-menu'

export function SelectionToolbar(props: FormattingToolbarProps) {
  return (
    <FormattingToolbar {...props}>
      <SelectionAiMenu key="selectionAiMenu" />
      <BlockTypeSelect key="blockTypeSelect" />
      <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
      <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
      <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
      <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
      <CreateLinkButton key="createLinkButton" />
      <AddCommentButton key="addCommentButton" />
      <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
      <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
      <ColorStyleButton key="colorStyleButton" />
    </FormattingToolbar>
  )
}
