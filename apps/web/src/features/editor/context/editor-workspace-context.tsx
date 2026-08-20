import { createContext, useContext } from 'react'

type EditorWorkspaceContextValue = {
  spaceId: string
}

const EditorWorkspaceContext = createContext<EditorWorkspaceContextValue | null>(null)

export function EditorWorkspaceProvider({
  spaceId,
  children,
}: {
  spaceId: string
  children: React.ReactNode
}) {
  return (
    <EditorWorkspaceContext.Provider value={{ spaceId }}>
      {children}
    </EditorWorkspaceContext.Provider>
  )
}

export function useEditorWorkspace() {
  const value = useContext(EditorWorkspaceContext)
  if (!value) {
    throw new Error('useEditorWorkspace must be used within EditorWorkspaceProvider')
  }
  return value
}
