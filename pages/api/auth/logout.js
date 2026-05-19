import { clearSessionCookie } from '../../../lib/session'

export default function handler(req, res) {
  clearSessionCookie(res)
  res.redirect('/')
}
