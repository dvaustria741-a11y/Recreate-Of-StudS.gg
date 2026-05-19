import { parse, serialize } from 'cookie'
import { setSessionCookie } from '../../lib/session'

export default async function handler(req, res) {
  const { code, state, error } = req.query

  // Handle user-denied access
  if (error) {
    return res.redirect('/?error=access_denied')
  }

  // Validate required params
  if (!code || !state) {
    return res.redirect('/?error=missing_params')
  }

  // Verify CSRF state
  const cookies = parse(req.headers.cookie || '')
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return res.redirect('/?error=invalid_state')
  }

  try {
    // Step 1: Exchange authorization code for access token
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

    // Step 2: Get user info with the access token
    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      return res.redirect('/?error=userinfo_failed')
    }

    const user = await userRes.json()

    // Step 3: Store session in a secure httpOnly cookie
    setSessionCookie(res, {
      userId: user.sub,
      username: user.preferred_username || user.name,
      avatar: user.picture || null,
      // We store the access token so we can call Roblox APIs later
      accessToken: tokens.access_token,
    })

    // Clear the oauth_state cookie
    res.setHeader('Set-Cookie', [
      ...([].concat(res.getHeader('Set-Cookie') || [])),
      serialize('oauth_state', '', { path: '/', maxAge: 0 }),
    ])

    // Redirect back to the app
    res.redirect('/')
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.redirect('/?error=server_error')
  }
}
