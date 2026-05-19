import { getSession } from '../../lib/session'

const SYSTEM_PROMPT = `You are an expert Roblox Luau game developer. Generate complete, working Roblox game scripts.

Return ONLY a raw JSON object â€” no markdown, no code fences, no extra text. Structure:
{
  "gameName": "Name Here",
  "gameDescription": "One sentence description",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "scripts": [
    {
      "name": "GameManager",
      "type": "Script",
      "location": "ServerScriptService",
      "description": "What this script does",
      "code": "-- complete working Luau code"
    }
  ],
  "setupSteps": ["Step 1", "Step 2"]
}

Rules:
- Generate 3-5 scripts covering core gameplay systems
- Write COMPLETE, production-quality Luau with inline comments
- Use RemoteEvents for client-server communication
- Include proper error handling and game loops
- type must be exactly one of: Script, LocalScript, ModuleScript
- location must be one of: ServerScriptService, StarterPlayerScripts, StarterGui, ReplicatedStorage, Workspace`

// Build a .rbxmx (Roblox model XML) so users can drag-and-drop into Studio
function buildRbxmx(scripts) {
  const items = scripts.map((s, i) => {
    const ref = `RBX${i}`
    // Escape XML special characters in code
    const escapedCode = s.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return `  <Item class="${s.type}" referent="${ref}">
    <Properties>
      <string name="Name">${s.name}</string>
      <ProtectedString name="Source"><![CDATA[${s.code}]]></ProtectedString>
      <bool name="Disabled">false</bool>
    </Properties>
  </Item>`
  }).join('\n')

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
${items}
</roblox>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Must be logged in
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { prompt } = req.body
  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'Prompt too short' })
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Create a Roblox game: ${prompt}` }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude API error:', err)
      return res.status(502).json({ error: 'AI generation failed' })
    }

    const claudeData = await claudeRes.json()
    const raw = (claudeData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const game = JSON.parse(cleaned)

    // Attach the .rbxmx file content for download
    game.rbxmx = buildRbxmx(game.scripts || [])

    return res.status(200).json({ game })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
