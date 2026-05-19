import { serialize } from 'cookie'
import { randomState } from '../../../lib/session'

export default function handler(req, res) {
  const state = randomState()

  res.setHeader('Set-Cookie', serialize('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 600,
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
