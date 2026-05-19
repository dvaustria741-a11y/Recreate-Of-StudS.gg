import { serialize } from 'cookie'
import { randomState } from '../../lib/session'

export default function handler(req, res) {
  const state = randomState()

  // Store state in a short-lived cookie to prevent CSRF
  res.setHeader('Set-Cookie', serialize('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  }))

  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    redirect_uri: process.env.ROBLOX_REDIRECT_URI,
    scope: 'openid profile',
    response_type: 'code',
    state,
  })

  res.redirect(`https://authorize.roblox.com?${params.toString()}`)
}
