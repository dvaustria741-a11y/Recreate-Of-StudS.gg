import { getSession } from '../../../lib/session'

export default function handler(req, res) {
  const session = getSession(req)
  if (!session) return res.status(401).json({ user: null })
  res.json({
    user: {
      userId: session.userId,
      username: session.username,
      avatar: session.avatar,
    }
  })
}
