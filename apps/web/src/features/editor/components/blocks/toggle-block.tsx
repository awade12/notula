import { defaultProps } from '@blocknote/core'
import { ToggleWrapper, createReactBlockSpec } from '@blocknote/react'

export const toggleBlockSpec = createReactBlockSpec(
  {
    type: 'toggle',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
    },
    content: 'inline',
  },
  {
    render: (props) => (
      <ToggleWrapper block={props.block} editor={props.editor}>
        <div className="notes-toggle-content" ref={props.contentRef} />
      </ToggleWrapper>
    ),
  },
)
