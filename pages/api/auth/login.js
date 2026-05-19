import { parse, serialize } from 'cookie'
import { setSessionCookie } from '../../../lib/session'

export default async function handler(req, res) {
  const { code, state, error } = req.query

  if (error) {
    return res.redirect('/?error=access_denied')
  }

  if (!code) {
    return res.redirect('/?error=missing_params')
  }

  try {
    const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.ROBLOX_REDIRECT_URI,
        client_id: process.env.ROBLOX_CLIENT_ID,
        client_secret: process.env.ROBLOX_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Token exchange failed:', err)
      return res.redirect('/?error=token_exchange_failed')
    }

    const tokens = await tokenRes.json()

    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      return res.redirect('/?error=userinfo_failed')
    }

    const user = await userRes.json()

    setSessionCookie(res, {
      userId: user.sub,
      username: user.preferred_username || user.name,
      avatar: user.picture || null,
      accessToken: tokens.access_token,
    })

    res.redirect('/')
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.redirect('/?error=server_error')
  }
}
