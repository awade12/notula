import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { parseEmbedUrl } from '../../lib/parse-embed-url'

type EmbedUrlInputProps = {
  url: string
  onUrlChange: (url: string) => void
  onEnter: () => void
}

function EmbedUrlInput({ url, onUrlChange, onEnter }: EmbedUrlInputProps) {
  return (
    <div className="notes-embed-input" contentEditable={false}>
      <input
        type="url"
        value={url}
        placeholder="Paste a link (YouTube, Vimeo, or HTTPS URL)"
        className="notes-embed-input-field"
        onChange={(event) => onUrlChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onEnter()
          }
        }}
      />
    </div>
  )
}

export const embedBlockSpec = createReactBlockSpec(
  {
    type: 'embed',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      url: { default: '' },
      caption: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const url = props.block.props.url
      const embed = url ? parseEmbedUrl(url) : null

      const updateUrl = (nextUrl: string) => {
        props.editor.updateBlock(props.block, {
          props: { url: nextUrl },
        })
      }

      if (!embed) {
        return (
          <EmbedUrlInput
            url={url}
            onUrlChange={updateUrl}
            onEnter={() => props.editor.setTextCursorPosition(props.block, 'end')}
          />
        )
      }

      return (
        <figure className="notes-embed" contentEditable={false}>
          <iframe
            src={embed.embedUrl}
            title={embed.title}
            className="notes-embed-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
          {props.block.props.caption ? (
            <figcaption className="notes-embed-caption">{props.block.props.caption}</figcaption>
          ) : null}
        </figure>
      )
    },
  },
)
