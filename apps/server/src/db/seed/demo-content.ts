export const DEMO_SPACE_NAME = 'Acme Product (Demo)'

export type DemoTeammate = {
  key: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
}

export const DEMO_TEAMMATES: DemoTeammate[] = [
  { key: 'sam', name: 'Sam Chen', email: 'sam.chen.demo@acme.local', role: 'admin' },
  { key: 'jordan', name: 'Jordan Lee', email: 'jordan.lee.demo@acme.local', role: 'member' },
  { key: 'riley', name: 'Riley Ortiz', email: 'riley.ortiz.demo@acme.local', role: 'member' },
]

export type DemoFolder = {
  key: string
  title: string
  icon: string
}

export const DEMO_FOLDERS: DemoFolder[] = [
  { key: 'planning', title: 'Product Planning', icon: '📋' },
  { key: 'engineering', title: 'Engineering', icon: '⚙️' },
  { key: 'research', title: 'Customer Research', icon: '🔍' },
]

export type DemoNote = {
  key: string
  title: string
  icon: string
  folderKey?: string
  daysAgo: number
  plaintext: string
  linksTo?: string[]
}

export const DEMO_NOTES: DemoNote[] = [
  {
    key: 'roadmap',
    title: 'Q1 Product Roadmap',
    icon: '🗺️',
    folderKey: 'planning',
    daysAgo: 3,
    plaintext: `# Q1 Product Roadmap

## Goals
- Ship teamspace-aware AI so notes and project tasks share context
- Improve hybrid search quality for launch week
- Reduce time-to-first-value for new workspaces

## Themes
1. **Collaboration** — realtime editing stays reliable offline
2. **Intelligence** — AI panel pulls relevant notes and tasks from the teamspace
3. **Projects** — kanban boards linked to documentation notes

## Milestones
- v1.5.0 — AI retrieval layer (in progress)
- v1.6.0 — Public project boards
- v1.7.0 — Meeting prep insights

## Open questions
- Should embeddings index task descriptions?
- Do we need a unified teamspace assistant chat?`,
    linksTo: ['launch-checklist'],
  },
  {
    key: 'launch-checklist',
    title: 'Launch Checklist — v1.5',
    icon: '✅',
    folderKey: 'planning',
    daysAgo: 1,
    plaintext: `# Launch Checklist — v1.5

## Must ship
- [ ] Teamspace context in AI completions
- [ ] Task AI reads linked documentation notes
- [ ] Hybrid search in Cmd+K
- [ ] Migration guide for existing workspaces

## Marketing
- [ ] Blog post draft (see linked task on Sprint board)
- [ ] Update landing page screenshots
- [ ] Record 90s demo video

## Dependencies
See Q1 Product Roadmap for milestone dates.
Pricing experiments note has copy for the announcement.`,
    linksTo: ['roadmap', 'pricing'],
  },
  {
    key: 'collab-architecture',
    title: 'Collab & AI Architecture',
    icon: '🏗️',
    folderKey: 'engineering',
    daysAgo: 5,
    plaintext: `# Collab & AI Architecture

## Principles
- Yjs is source of truth for page bodies
- Row properties update over HTTP with broadcast
- AI routes require space membership before retrieval

## Retrieval pipeline
1. User prompt + page/task context form the query
2. Hybrid search over pages in the teamspace
3. Keyword search over project board tasks
4. Inject teamspace name, members, and top hits into the prompt

## Decisions
- Ghost completion skips retrieval for latency
- Linked notes on tasks are fetched server-side
- Embeddings remain async after page save`,
    linksTo: ['api-design'],
  },
  {
    key: 'api-design',
    title: 'API Design — Workspace Context',
    icon: '🔌',
    folderKey: 'engineering',
    daysAgo: 8,
    plaintext: `# API Design — Workspace Context

POST /api/ai/complete accepts optional spaceId and pageId.
POST /api/ai/task-agent accepts spaceId, boardId, taskId, linkedPageId.

When spaceId is present the server:
- Verifies membership
- Loads teamspace metadata
- Runs hybrid retrieval for notes and keyword search for tasks

Clients pass spaceId from the active route — notes editor and project task panel.`,
    linksTo: ['collab-architecture'],
  },
  {
    key: 'interviews',
    title: 'User Interview Synthesis — Aug 2026',
    icon: '🎤',
    folderKey: 'research',
    daysAgo: 12,
    plaintext: `# User Interview Synthesis

## Participants
6 product leads from teams of 5–40 people

## Top pain points
1. AI only sees the current page — not the rest of the workspace
2. Tasks and notes feel disconnected
3. Hard to find decisions made weeks ago

## Quotes
> "I want to ask AI what we decided about pricing without opening twelve pages."

> "When I update a task, the spec doc should already be in context."

## Recommendations
- Teamspace-scoped retrieval for AI
- Link tasks to documentation notes
- Surface related pages in meeting prep`,
    linksTo: ['pricing'],
  },
  {
    key: 'pricing',
    title: 'Pricing Experiments',
    icon: '💰',
    folderKey: 'research',
    daysAgo: 20,
    plaintext: `# Pricing Experiments

## Current hypothesis
Teams pay for shared intelligence — not just storage.

## Tests run
- **Seat-based** vs **workspace-based** billing messaging
- Free tier with 3 teamspaces vs 1 teamspace

## Decision (draft)
Launch with workspace-based pricing. Include AI retrieval in Pro tier.
Announcement copy: "Your teamspace becomes context — notes and projects together."

## Follow-ups
- Validate with 3 design partners before public launch`,
  },
  {
    key: 'weekly-sync',
    title: 'Weekly Sync — Aug 18',
    icon: '📅',
    daysAgo: 2,
    plaintext: `# Weekly Sync — Aug 18

## Attendees
Sam, Jordan, Riley, and product

## Discussion
- Demo seed data for QA looks good
- AI panel now pulls related notes when asking about launch
- Project task AI should reference linked spec docs

## Action items
- [ ] Sam — finish retrieval edge cases
- [ ] Jordan — polish task AI tab empty states
- [ ] Riley — write launch blog outline

## Decisions
Ship teamspace context behind existing OpenRouter settings — no new toggle.`,
    linksTo: ['interviews', 'launch-checklist'],
  },
  {
    key: 'onboarding',
    title: 'Onboarding Playbook',
    icon: '🚀',
    daysAgo: 45,
    plaintext: `# Onboarding Playbook

## Day 1
Create a teamspace, invite teammates, add first project board.

## Day 3
Link tasks to documentation notes.
Enable embeddings in Settings → AI for semantic search.

## Stale content
Pages untouched for 30+ days show stale insights — good for demo data testing.`,
  },
]

export type DemoTask = {
  key: string
  title: string
  status: 'backlog' | 'todo' | 'doing' | 'done'
  labels: string[]
  milestone: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimate: number | null
  dueDate: string | null
  assigneeKey?: string
  linkedNoteKey?: string
  description: string
}

export const DEMO_BOARD_TITLE = 'Sprint 42 — Launch'

export const DEMO_TASKS: DemoTask[] = [
  {
    key: 'retrieval',
    title: 'Ship teamspace retrieval for AI completions',
    status: 'doing',
    labels: ['feature'],
    milestone: 'v1-5-0',
    priority: 'urgent',
    estimate: 5,
    dueDate: '2026-08-28',
    assigneeKey: 'sam',
    linkedNoteKey: 'collab-architecture',
    description:
      'Wire hybrid search + task keyword search into /complete and /task-agent. Include linked note plaintext for project tasks.',
  },
  {
    key: 'offline-banner',
    title: 'Fix offline reconnect banner copy',
    status: 'todo',
    labels: ['bug', 'improvement'],
    milestone: 'v1-5-0',
    priority: 'medium',
    estimate: 2,
    dueDate: '2026-08-25',
    assigneeKey: 'jordan',
    description:
      'Banner should say "Reconnecting…" not "Disconnected" when provider is retrying. Match collab architecture doc.',
  },
  {
    key: 'launch-blog',
    title: 'Draft launch blog post',
    status: 'backlog',
    labels: ['docs'],
    milestone: 'v1-5-0',
    priority: 'high',
    estimate: 3,
    dueDate: '2026-09-05',
    assigneeKey: 'riley',
    linkedNoteKey: 'launch-checklist',
    description:
      'Outline: teamspace-aware AI, notes + projects together, hybrid search. Pull quotes from user interview synthesis.',
  },
  {
    key: 'migrate-users',
    title: 'Migrate legacy workspace slugs',
    status: 'done',
    labels: ['chore'],
    milestone: 'v1-4-5',
    priority: 'low',
    estimate: 1,
    dueDate: null,
    assigneeKey: 'sam',
    description: 'One-time script for spaces created before slug uniqueness constraint.',
  },
  {
    key: 'task-ai-context',
    title: 'Inject linked note content into task AI',
    status: 'doing',
    labels: ['feature'],
    milestone: 'v1-5-0',
    priority: 'high',
    estimate: 3,
    dueDate: '2026-08-30',
    assigneeKey: 'sam',
    linkedNoteKey: 'api-design',
    description:
      'When a task links a documentation note, fetch plaintext server-side and add to teamspace context block.',
  },
  {
    key: 'pricing-copy',
    title: 'Review pricing page copy with research',
    status: 'todo',
    labels: ['design'],
    milestone: 'v1-6-0',
    priority: 'medium',
    estimate: 2,
    dueDate: '2026-09-12',
    assigneeKey: 'riley',
    linkedNoteKey: 'pricing',
    description:
      'Align announcement with pricing experiments doc. Emphasize workspace-based billing.',
  },
  {
    key: 'seed-data',
    title: 'Add demo seed script for QA',
    status: 'done',
    labels: ['chore', 'qa'],
    milestone: 'v1-5-0',
    priority: 'medium',
    estimate: 2,
    dueDate: null,
    assigneeKey: 'jordan',
    description:
      'Populate Acme Product demo teamspace with notes, links, and sprint tasks for AI retrieval testing.',
  },
]
