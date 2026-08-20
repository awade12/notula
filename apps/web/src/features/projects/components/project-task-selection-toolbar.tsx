import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  type FormattingToolbarProps,
  TextAlignButton,
} from '@blocknote/react'

export function ProjectTaskSelectionToolbar(props: FormattingToolbarProps) {
  return (
    <FormattingToolbar {...props}>
      <BlockTypeSelect key="blockTypeSelect" />
      <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
      <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
      <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
      <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
      <CreateLinkButton key="createLinkButton" />
      <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
      <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
      <ColorStyleButton key="colorStyleButton" />
    </FormattingToolbar>
  )
}
