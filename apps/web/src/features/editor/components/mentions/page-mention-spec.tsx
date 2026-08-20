import { createReactInlineContentSpec } from '@blocknote/react'
import { PageMentionLink } from './page-mention-link'

export const pageMentionSpec = createReactInlineContentSpec(
  {
    type: 'pageMention',
    propSchema: {
      pageId: { default: '' },
      title: { default: 'Untitled' },
      spaceId: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const { pageId, title, spaceId } = props.inlineContent.props

      if (!pageId || !spaceId) {
        return <span className="notes-page-mention">@{title}</span>
      }

      return (
        <PageMentionLink spaceId={spaceId} pageId={pageId} title={title} />
      )
    },
  },
)
