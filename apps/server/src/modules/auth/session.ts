import { eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { session, user } from '../../db/schema/auth'

export async function findSessionByToken(db: Db, token: string) {
  const [row] = await db
    .select({
      sessionId: session.id,
      expiresAt: session.expiresAt,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.token, token))
    .limit(1)

  if (!row || row.expiresAt <= new Date()) {
    return null
  }

  return {
    session: { id: row.sessionId, token },
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      image: row.userImage,
    },
  }
}
