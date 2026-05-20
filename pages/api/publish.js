import { getSession } from '../../lib/session'

// FIX: Increase body size limit — default 1 MB can truncate large place files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { rbxl, gameName, apiKey, universeId, placeId } = req.body

  if (!apiKey)      return res.status(400).json({ error: 'API key required' })
  if (!universeId)  return res.status(400).json({ error: 'Universe ID required' })
  if (!placeId)     return res.status(400).json({ error: 'Place ID required' })
  if (!rbxl)        return res.status(400).json({ error: 'No game data' })

  try {
    // FIX: Roblox Open Cloud requires application/octet-stream, not application/xml.
    // Sending application/xml causes "Invalid Content stream" (HTTP 400).
    // We encode the XML string to a UTF-8 Buffer so binary-safe transfer is guaranteed.
    const bodyBuffer = Buffer.from(rbxl, 'utf8')

    const publishRes = await fetch(
      `https://apis.roblox.com/universes/v1/${universeId}/places/${placeId}/versions?versionType=Published`,
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/octet-stream',   // ← was 'application/xml'
          'Content-Length': String(bodyBuffer.length),
        },
        body: bodyBuffer,
      }
    )

    const text = await publishRes.text()

    if (!publishRes.ok) {
      console.error('Roblox publish error:', text)
      return res.status(502).json({ error: `Publish failed: ${text.slice(0, 200)}` })
    }

    let data = {}
    try { data = JSON.parse(text) } catch {}

    return res.status(200).json({
      success: true,
      versionNumber: data.versionNumber || '?',
      placeId,
      universeId,
    })
  } catch (err) {
    console.error('Publish error:', err)
    return res.status(500).json({ error: err.message })
  }
}
