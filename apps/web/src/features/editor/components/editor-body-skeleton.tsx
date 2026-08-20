export function EditorBodySkeleton() {
  return (
    <div className="notes-editor mt-2 space-y-3 px-1" aria-hidden>
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-sidebar/10" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-sidebar/10" />
      <div className="h-4 w-2/3 max-w-sm animate-pulse rounded bg-sidebar/10" />
    </div>
  )
}
