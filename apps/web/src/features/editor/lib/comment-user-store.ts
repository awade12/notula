import { createUserStore, type User, type UserStore } from '@blocknote/core'
import { userColor } from './user-color'

type CommentUser = {
  id: string
  name: string
}

export function toBlockNoteUser(id: string, name: string): User {
  return {
    id,
    username: name,
    avatarUrl: '',
    color: userColor(id),
  }
}

export function createCommentUserStore(
  currentUser: CommentUser,
  memberNamesRef: { current: Map<string, string> },
): UserStore<User> {
  const store = createUserStore<User>(async (userIds) =>
    userIds.flatMap((id) => {
      const name =
        id === currentUser.id ? currentUser.name : memberNamesRef.current.get(id)
      return name ? [toBlockNoteUser(id, name)] : []
    }),
  )

  store.setUser(toBlockNoteUser(currentUser.id, currentUser.name))
  return store
}

export function seedCommentMemberNames(
  store: UserStore<User>,
  memberNamesRef: { current: Map<string, string> },
  members: Array<{ userId: string; name: string }>,
) {
  for (const member of members) {
    memberNamesRef.current.set(member.userId, member.name)
  }

  store.setUser(members.map((member) => toBlockNoteUser(member.userId, member.name)))
}
