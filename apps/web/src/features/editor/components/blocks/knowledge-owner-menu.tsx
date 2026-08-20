import { Menu } from '@mantine/core'
import { ChevronDown, UserRound } from 'lucide-react'
import type { InsightOptions } from '@/features/insights/types'

export function KnowledgeOwnerMenu({
  owner,
  members,
  onChange,
}: {
  owner: string
  members: InsightOptions['members']
  onChange: (owner: string) => void
}) {
  const ownerName =
    members.find((member) => member.id === owner)?.name ??
    (owner ? owner : 'Assign owner')

  return (
    <Menu withinPortal={false} position="bottom-start" offset={4}>
      <Menu.Target>
        <button type="button" className="notes-loop-meta-trigger">
          <UserRound size={11} strokeWidth={1.75} aria-hidden />
          <span>{ownerName}</span>
          <ChevronDown size={11} strokeWidth={2} aria-hidden />
        </button>
      </Menu.Target>
      <Menu.Dropdown className="notes-knowledge-menu">
        <Menu.Item onClick={() => onChange('')}>Unassigned</Menu.Item>
        {owner && !members.some((member) => member.id === owner) ? (
          <Menu.Item onClick={() => onChange(owner)}>{owner}</Menu.Item>
        ) : null}
        {members.map((member) => (
          <Menu.Item key={member.id} onClick={() => onChange(member.id)}>
            {member.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
