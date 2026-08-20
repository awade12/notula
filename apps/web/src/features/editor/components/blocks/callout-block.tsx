import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { Menu } from '@mantine/core'
import { calloutTypes, getCalloutType } from '../../lib/callout-types'

export const calloutBlockSpec = createReactBlockSpec(
  {
    type: 'callout',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: 'info',
        values: ['info', 'warning', 'success', 'tip'],
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const callout = getCalloutType(props.block.props.type)
      const Icon = callout.icon

      return (
        <div className="notes-callout" data-callout-type={props.block.props.type}>
          <Menu withinPortal={false} position="bottom-start" offset={4}>
            <Menu.Target>
              <button
                type="button"
                className="notes-callout-icon-button"
                contentEditable={false}
                aria-label="Change callout type"
              >
                <Icon size={18} strokeWidth={2} />
              </button>
            </Menu.Target>
            <Menu.Dropdown className="notes-callout-menu">
              <Menu.Label>Callout type</Menu.Label>
              {calloutTypes.map((type) => {
                const ItemIcon = type.icon
                return (
                  <Menu.Item
                    key={type.value}
                    leftSection={<ItemIcon size={16} strokeWidth={2} />}
                    onClick={() =>
                      props.editor.updateBlock(props.block, {
                        type: 'callout',
                        props: { type: type.value },
                      })
                    }
                  >
                    {type.title}
                  </Menu.Item>
                )
              })}
            </Menu.Dropdown>
          </Menu>
          <div className="notes-callout-content" ref={props.contentRef} />
        </div>
      )
    },
  },
)
