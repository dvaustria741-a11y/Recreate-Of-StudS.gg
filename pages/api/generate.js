import { getSession } from '../../lib/session'

async function searchFreeModels(keywords) {
  const results = []
  for (const keyword of keywords.slice(0, 4)) {
    try {
      const url = `https://catalog.roblox.com/v1/search/items?category=Models&keyword=${encodeURIComponent(keyword)}&limit=5&minPrice=0&maxPrice=0&salesTypeFilter=1`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const item of (data.data || []).slice(0, 3)) {
        if (item.id && item.name) {
          results.push({ id: item.id, name: item.name, keyword })
        }
      }
    } catch {
      // Catalog API unavailable — continue without assets
    }
  }
  return results
}

function buildRbxl(scripts) {
  let refCounter = 0
  const ref = () => `RBX${String(refCounter++).padStart(8, '0')}`
  const escape = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const byLocation = {}
  for (const s of scripts) {
    const loc = s.location || 'ServerScriptService'
    if (!byLocation[loc]) byLocation[loc] = []
    byLocation[loc].push(s)
  }

  const scriptItem = (s) => `
        <Item class="${s.type}" referent="${ref()}">
          <Properties>
            <string name="Name">${escape(s.name)}</string>
            <ProtectedString name="Source"><![CDATA[${s.code}]]></ProtectedString>
            <bool name="Disabled">false</bool>
          </Properties>
        </Item>`

  const serviceScripts = (location) =>
    (byLocation[location] || []).map(scriptItem).join('')

  const workspaceRef = ref()
  const sssRef = ref()
  const starterGuiRef = ref()
  const starterPlayerRef = ref()
  const starterPlayerScriptsRef = ref()
  const starterCharRef = ref()
  const replStorageRef = ref()
  const lightingRef = ref()
  const dataModelRef = ref()

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="DataModel" referent="${dataModelRef}">
    <Properties>
      <string name="Name">Place</string>
    </Properties>
    <Item class="Workspace" referent="${workspaceRef}">
      <Properties>
        <string name="Name">Workspace</string>
        <bool name="FilteringEnabled">true</bool>
        <float name="Gravity">196.2</float>
      </Properties>
      ${serviceScripts('Workspace')}
    </Item>
    <Item class="Lighting" referent="${lightingRef}">
      <Properties>
        <string name="Name">Lighting</string>
      </Properties>
      ${serviceScripts('Lighting')}
    </Item>
    <Item class="ReplicatedStorage" referent="${replStorageRef}">
      <Properties>
        <string name="Name">ReplicatedStorage</string>
      </Properties>
      ${serviceScripts('ReplicatedStorage')}
    </Item>
    <Item class="ServerScriptService" referent="${sssRef}">
      <Properties>
        <string name="Name">ServerScriptService</string>
      </Properties>
      ${serviceScripts('ServerScriptService')}
    </Item>
    <Item class="StarterGui" referent="${starterGuiRef}">
      <Properties>
        <string name="Name">StarterGui</string>
        <bool name="ResetPlayerGuiOnSpawn">false</bool>
      </Properties>
      ${serviceScripts('StarterGui')}
    </Item>
    <Item class="StarterPlayer" referent="${starterPlayerRef}">
      <Properties>
        <string name="Name">StarterPlayer</string>
      </Properties>
      <Item class="StarterPlayerScripts" referent="${starterPlayerScriptsRef}">
        <Properties>
          <string name="Name">StarterPlayerScripts</string>
        </Properties>
        ${serviceScripts('StarterPlayerScripts')}
      </Item>
      <Item class="StarterCharacterScripts" referent="${starterCharRef}">
        <Properties>
          <string name="Name">StarterCharacterScripts</string>
        </Properties>
        ${serviceScripts('StarterCharacterScripts')}
      </Item>
    </Item>
  </Item>
</roblox>`
}

function buildSystemPrompt(freeAssets) {
  const assetContext = freeAssets.length > 0
    ? `\n\nFREE ROBLOX CREATOR STORE ASSETS YOU CAN USE (InsertService:LoadAsset(id)):\n` +
      freeAssets.map(a => `- "${a.name}" (id: ${a.id}) [search: ${a.keyword}]`).join('\n') +
      `\n\nIn your MapBuilder script, load relevant assets with:\n` +
      `local model = game:GetService("InsertService"):LoadAsset(ASSET_ID)\n` +
      `model.Parent = workspace`
    : ''

  return `You are a senior Roblox game developer with 10 years of experience shipping AAA Roblox titles. You write production-quality Luau that other developers would be proud of.

CRITICAL: Return ONLY a raw JSON object. No markdown, no code fences, no preamble. Raw JSON only.
CRITICAL: All string values in JSON must be properly escaped. In "code" fields, escape all backslashes as \\\\, all quotes as \\", all newlines as \\n.

JSON structure:
{
  "gameName": "string",
  "gameDescription": "string",
  "genre": "string",
  "features": ["string"],
  "assetKeywords": ["keyword1", "keyword2"],
  "scripts": [
    {
      "name": "string",
      "type": "Script|LocalScript|ModuleScript",
      "location": "ServerScriptService|StarterPlayerScripts|StarterGui|ReplicatedStorage|Workspace|Lighting|StarterCharacterScripts",
      "description": "string",
      "code": "string (properly JSON-escaped Luau code)"
    }
  ],
  "setupSteps": ["string"]
}

REQUIRED SCRIPTS:
1. GameManager (ServerScriptService) - round logic, game states
2. PlayerDataManager (ServerScriptService) - DataStore saving/loading
3. EventsSetup (ServerScriptService) - create all RemoteEvents
4. MapBuilder (ServerScriptService) - build terrain and structures
5. LightingSetup (Lighting) - atmosphere and visual effects
6. UIManager (StarterGui LocalScript) - full HUD and menus
7. ClientController (StarterPlayerScripts LocalScript) - input handling
8. Config (ReplicatedStorage ModuleScript) - game constants

RULES:
- Every script must be COMPLETE with no placeholders
- Use pcall() around all DataStore operations
- Validate all RemoteEvent inputs on server
- Use TweenService for UI animations
- Mobile-friendly touch controls where needed
${assetContext}`
}

function safeJsonParse(raw) {
  // Remove markdown fences
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // Try direct parse first
  try {
    return JSON.parse(cleaned)
  } catch (e1) {
    // Try to extract JSON object
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch (e2) {
        // Try fixing common issues: unescaped control characters in strings
        try {
          const fixed = cleaned.replace(
            /"code"\s*:\s*"([\s\S]*?)(?<!\\)"/g,
            (match, code) => {
              const escaped = code
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
              return `"code": "${escaped}"`
            }
          )
          return JSON.parse(fixed)
        } catch (e3) {
          throw new Error(`JSON parse failed: ${e1.message}`)
        }
      }
    }
    throw new Error(`JSON parse failed: ${e1.message}`)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { prompt } = req.body
  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'Prompt too short' })
  }

  try {
    // Step 1: Keyword extraction for free assets
    let freeAssets = []
    try {
      const kwRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://studs.gg',
          'X-Title': 'Studs.gg',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite-001',
          max_tokens: 120,
          temperature: 0.2,
          messages: [{
            role: 'user',
            content: `Given this Roblox game description: "${prompt}"
List 4 short keywords (1-2 words each) for free 3D models to search on Roblox Creator Store.
Reply ONLY with a JSON array of strings. Example: ["tree","building","sword","chest"]`,
          }],
        }),
      })
      if (kwRes.ok) {
        const kwData = await kwRes.json()
        const kwRaw = kwData.choices?.[0]?.message?.content || '[]'
        const kwCleaned = kwRaw.replace(/```(?:json)?/g, '').trim()
        const keywords = JSON.parse(kwCleaned)
        if (Array.isArray(keywords)) freeAssets = await searchFreeModels(keywords)
      }
    } catch {
      // Asset search failed — continue without assets
    }

    // Step 2: Generate full game with model fallback chain
    const MODELS = [
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-4-maverick:free',
      'meta-llama/llama-4-scout:free',
      'google/gemini-2.0-flash-lite-001',
    ]

    const systemPrompt = buildSystemPrompt(freeAssets)
    let raw = ''
    let modelUsed = ''
    let lastError = ''

    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}`)
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://studs.gg',
            'X-Title': 'Studs.gg',
          },
          body: JSON.stringify({
            model,
            max_tokens: 32000,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Create this complete Roblox game. Generate every required script:\n\n${prompt}` },
            ],
          }),
        })

        if (!orRes.ok) {
          const errText = await orRes.text()
          lastError = `${model} failed (HTTP ${orRes.status}): ${errText.slice(0, 300)}`
          console.warn(lastError)
          continue
        }

        const orData = await orRes.json()

        if (orData.error) {
          lastError = `${model} error: ${orData.error.message || JSON.stringify(orData.error)}`
          console.warn(lastError)
          continue
        }

        const text = orData.choices?.[0]?.message?.content || ''
        if (!text) {
          lastError = `${model} returned empty content`
          console.warn(lastError)
          continue
        }

        raw = text
        modelUsed = model
        console.log(`Success with: ${model}`)
        break

      } catch (err) {
        lastError = `${model} threw: ${err.message}`
        console.warn(lastError)
        continue
      }
    }

    if (!raw) {
      console.error('All models failed. Last error:', lastError)
      return res.status(502).json({
        error: `All AI models failed. Check your OPENROUTER_API_KEY in Vercel environment variables.`,
      })
    }

    const game = safeJsonParse(raw)
    game.modelUsed = modelUsed
    game.freeAssetsUsed = freeAssets
    game.rbxl = buildRbxl(game.scripts || [])

    return res.status(200).json({ game })

  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
