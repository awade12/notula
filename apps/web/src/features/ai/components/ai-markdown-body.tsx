import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/cn'

type AiMarkdownBodyProps = {
  content: string
  spaceId?: string
  className?: string
}

function AiMarkdownLink({
  href,
  children,
  spaceId,
}: {
  href?: string
  children: ReactNode
  spaceId?: string
}) {
  if (spaceId && href?.startsWith('note:')) {
    const pageId = href.slice(5)
    return (
      <Link
        to="/s/$spaceId/p/$pageId"
        params={{ spaceId, pageId }}
        className="underline underline-offset-2 hover:text-text-emphasis"
      >
        {children}
      </Link>
    )
  }

  if (spaceId && href?.startsWith('task:')) {
    const parts = href.slice(5).split('/')
    const boardId = parts[0]
    const taskId = parts[1]
    if (boardId && taskId) {
      return (
        <Link
          to="/s/$spaceId/projects/$boardId"
          params={{ spaceId, boardId }}
          search={{ task: taskId }}
          className="underline underline-offset-2 hover:text-text-emphasis"
        >
          {children}
        </Link>
      )
    }
  }

  if (!href) {
    return <span>{children}</span>
  }

  return (
    <a
      href={href}
      className="underline underline-offset-2 hover:text-text-emphasis"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  )
}

function allowWorkspaceCitationUrls(url: string) {
  if (url.startsWith('note:') || url.startsWith('task:')) return url
  return defaultUrlTransform(url)
}

export function AiMarkdownBody({ content, spaceId, className }: AiMarkdownBodyProps) {
  if (!content.trim()) return null

  return (
    <div className={cn('text-sm leading-relaxed tracking-dashboard', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={allowWorkspaceCitationUrls}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-medium text-text-emphasis">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-medium text-text-emphasis first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-medium text-text-emphasis first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-sm font-medium text-text-emphasis first:mt-0">
              {children}
            </h3>
          ),
          a: ({ href, children }) => (
            <AiMarkdownLink href={href} spaceId={spaceId}>
              {children}
            </AiMarkdownLink>
          ),
          code: ({ children }) => (
            <code className="rounded bg-sidebar px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
