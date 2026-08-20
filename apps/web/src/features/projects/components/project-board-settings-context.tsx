import { createContext, useContext, type ReactNode } from 'react'
import type { Database } from '@/features/database/types'

type ProjectBoardSettingsContextValue = {
  spaceId: string
  boardId: string
  database: Database
  canEdit: boolean
}

const ProjectBoardSettingsContext = createContext<ProjectBoardSettingsContextValue | null>(null)

type ProjectBoardSettingsProviderProps = ProjectBoardSettingsContextValue & {
  children: ReactNode
}

export function ProjectBoardSettingsProvider({
  spaceId,
  boardId,
  database,
  canEdit,
  children,
}: ProjectBoardSettingsProviderProps) {
  return (
    <ProjectBoardSettingsContext.Provider value={{ spaceId, boardId, database, canEdit }}>
      {children}
    </ProjectBoardSettingsContext.Provider>
  )
}

export function useProjectBoardSettings() {
  const value = useContext(ProjectBoardSettingsContext)
  if (!value) {
    throw new Error('useProjectBoardSettings must be used within ProjectBoardSettingsProvider')
  }
  return value
}
