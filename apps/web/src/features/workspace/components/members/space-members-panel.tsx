import { Copy, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import {
  buildInviteUrl,
  useMemberActions,
  useSpaceInvites,
  useSpaceMembers,
} from '@/features/workspace/hooks/use-space-members'
import { SettingsSection } from '@/features/settings/components/settings-section'

type SpaceMembersPanelProps = {
  spaceId: string
}

const roleOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
] as const

export function SpaceMembersPanel({ spaceId }: SpaceMembersPanelProps) {
  const { data: members = [], isLoading } = useSpaceMembers(spaceId)
  const { data: invites = [] } = useSpaceInvites(spaceId)
  const { updateRole, removeMember, createInvite, revokeInvite } = useMemberActions(spaceId)
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreateInvite() {
    setError(null)
    try {
      const invite = await createInvite.mutateAsync({ role: inviteRole })
      const url = buildInviteUrl(invite.token)
      await navigator.clipboard.writeText(url)
      setCopiedToken(invite.token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      setError('Could not create invite link')
    }
  }

  return (
    <div className="space-y-5">
      <SettingsSection
        title="Invite link"
        description="Share a link to add editors or viewers to this space."
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
            className={cn(
              'rounded-lg border border-border bg-sidebar px-3 py-2',
              'text-sm tracking-dashboard text-text-emphasis outline-none',
            )}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={() => void handleCreateInvite()}
            disabled={createInvite.isPending}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2',
              'text-sm tracking-dashboard text-text-emphasis hover:bg-white/14',
              'disabled:opacity-40',
            )}
          >
            <Link2 size={14} />
            {createInvite.isPending ? 'Creating…' : 'Copy invite link'}
          </button>
          {copiedToken ? (
            <span className="text-meta tracking-dashboard text-emerald-400/90">Link copied</span>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-meta text-red-400">{error}</p> : null}

        {invites.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm tracking-dashboard text-text-emphasis">
                    {invite.role} invite
                  </p>
                  <p className="truncate text-meta tracking-dashboard text-text-primary">
                    {buildInviteUrl(invite.token)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-2 text-text-primary hover:bg-white/5 hover:text-text-emphasis"
                    onClick={() => void navigator.clipboard.writeText(buildInviteUrl(invite.token))}
                    aria-label="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-text-primary hover:bg-white/5 hover:text-red-400"
                    onClick={() => void revokeInvite.mutateAsync(invite.id)}
                    aria-label="Revoke invite"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </SettingsSection>

      <SettingsSection title="Members" description="People with access to this space.">
        {isLoading ? (
          <p className="text-sm tracking-dashboard text-text-primary">Loading…</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-text-emphasis">
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm tracking-dashboard text-text-emphasis">{member.name}</p>
                  <p className="truncate text-meta tracking-dashboard text-text-primary">{member.email}</p>
                </div>
                {member.role === 'owner' ? (
                  <span className="text-meta tracking-dashboard text-text-primary">Owner</span>
                ) : (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      void updateRole.mutateAsync({ memberId: member.id, role: e.target.value })
                    }
                    className={cn(
                      'rounded-lg border border-border bg-sidebar px-2 py-1',
                      'text-meta tracking-dashboard text-text-emphasis outline-none',
                    )}
                  >
                    {roleOptions.filter((r) => r.value !== 'owner').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {member.role !== 'owner' ? (
                  <button
                    type="button"
                    className="rounded-md p-2 text-text-primary hover:text-red-400"
                    onClick={() => void removeMember.mutateAsync(member.id)}
                    aria-label="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  )
}
