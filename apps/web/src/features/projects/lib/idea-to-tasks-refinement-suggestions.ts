export type IdeaToTasksRefinementSuggestion = {
  label: string
  prompt: string
}

export const IDEA_TO_TASKS_REFINEMENT_SUGGESTIONS: IdeaToTasksRefinementSuggestion[] = [
  {
    label: 'One epic task',
    prompt: 'Merge everything into a single epic task with one comprehensive description.',
  },
  {
    label: 'About 3 tasks',
    prompt: 'Reduce to about 3 high-level tasks that still cover the full scope.',
  },
  {
    label: 'Fewer tasks',
    prompt: 'Combine related work into fewer tasks — aim for 4 to 5 max.',
  },
  {
    label: 'More detail',
    prompt: 'Break this into more granular tasks with clearer acceptance criteria.',
  },
]
