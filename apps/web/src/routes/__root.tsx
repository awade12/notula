import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { getInitialAppearanceScript } from '../features/settings/lib/apply-appearance'
import { appName } from '../lib/app-brand'
import { queryClient } from '../lib/query-client'
import appCss from '../styles.css?url'

export type RouterContext = {
  queryClient: QueryClient
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-text-emphasis">Page not found</h1>
        <p className="mt-2 text-sm text-text-primary">That route does not exist.</p>
        <a href="/" className="mt-6 inline-block text-sm text-text-primary underline-offset-2 hover:underline">
          Go home
        </a>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: appName },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: getInitialAppearanceScript() }} />
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
