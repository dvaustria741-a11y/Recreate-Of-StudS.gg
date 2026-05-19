import jwt from 'jsonwebtoken'
import { parse, serialize } from 'cookie'

const SESSION_COOKIE = 'studs_session'
const SECRET = process.env.SESSION_SECRET

export function createSession(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '2h' })
}

export function getSession(req) {
  try {
    const cookies = parse(req.headers.cookie || '')
    const token = cookies[SESSION_COOKIE]
    if (!token) return null
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function setSessionCookie(res, payload) {
  const token = createSession(payload)
  res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2, // 2 hours
  }))
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }))
}

export function randomState() {
  const arr = new Uint8Array(24)
  // Node.js crypto fallback
  const crypto = require('crypto')
  return crypto.randomBytes(24).toString('hex')
}
