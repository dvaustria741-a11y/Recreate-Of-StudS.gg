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
    } catch {}
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

  // Remap Lighting scripts to ServerScriptService
  // Scripts inside Lighting service do NOT execute in Roblox
  const remapped = scripts.map(s => ({
    ...s,
    location: s.location === 'Lighting' ? 'ServerScriptService' : s.location,
  }))

  const byLocation = {}
  for (const s of remapped) {
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

  const dataModelRef = ref()
  const workspaceRef = ref()
  const baseplateRef = ref()
  const spawnRef = ref()
  const terrainRef = ref()
  const sssRef = ref()
  const starterGuiRef = ref()
  const starterPlayerRef = ref()
  const starterPlayerScriptsRef = ref()
  const starterCharRef = ref()
  const replStorageRef = ref()
  const lightingRef = ref()

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

      <Item class="Terrain" referent="${terrainRef}">
        <Properties>
          <string name="Name">Terrain</string>
        </Properties>
      </Item>

      <Item class="Part" referent="${baseplateRef}">
        <Properties>
          <string name="Name">Baseplate</string>
          <bool name="Anchored">true</bool>
          <bool name="Locked">true</bool>
          <token name="Shape">0</token>
          <Vector3 name="Size">
            <X>512</X><Y>20</Y><Z>512</Z>
          </Vector3>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>-10</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
          <BrickColor name="BrickColor">194</BrickColor>
          <token name="Material">256</token>
        </Properties>
      </Item>

      <Item class="SpawnLocation" referent="${spawnRef}">
        <Properties>
          <string name="Name">SpawnLocation</string>
          <bool name="Anchored">true</bool>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>1</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
          <Vector3 name="Size">
            <X>6</X><Y>1</Y><Z>6</Z>
          </Vector3>
          <BrickColor name="BrickColor">37</BrickColor>
          <bool name="Neutral">true</bool>
          <float name="Duration">0</float>
        </Properties>
      </Item>

      ${serviceScripts('Workspace')}
    </Item>

    <Item class="Lighting" referent="${lightingRef}">
      <Properties>
        <string name="Name">Lighting</string>
        <Color3 name="Ambient">
          <R>0.5</R><G>0.5</G><B>0.5</B>
        </Color3>
        <Color3 name="OutdoorAmbient">
          <R>0.5</R><G>0.5</G><B>0.5</B>
        </Color3>
        <float name="Brightness">2</float>
        <float name="ClockTime">14</float>
        <float name="FogEnd">100000</float>
        <bool name="GlobalShadows">true</bool>
      </Properties>
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
      "location": "ServerScriptService|StarterPlayerScripts|StarterGui|ReplicatedStorage|Workspace|StarterCharacterScripts",
      "description": "string",
      "code": "string (properly JSON-escaped Luau code)"
    }
  ],
  "setupSteps": ["string"]
}

IMPORTANT LOCATION RULES:
- NEVER use "Lighting" as a location â€” scripts there do not run in Roblox
- Put LightingSetup in "ServerScriptService" and use game.Lighting inside the script
- Scripts in ServerScriptService run on the server at game start
- LocalScripts go in StarterGui, StarterPlayerScripts, or StarterCharacterScripts only

REQUIRED SCRIPTS:
1. EventsSetup (ServerScriptService Script) - create ALL RemoteEvents and RemoteFunctions first
2. GameManager (ServerScriptService Script) - round logic, game states, win/lose
3. PlayerDataManager (ServerScriptService Script) - DataStore saving/loading with auto-save
4. MapBuilder (ServerScriptService Script) - build terrain using workspace.Terrain:FillBlock() and Instance.new("Part") - must build a COMPLETE playable map with actual structures
5. LightingSetup (ServerScriptService Script) - set game.Lighting properties, add Atmosphere, Bloom, ColorCorrection instances
6. UIManager (StarterGui LocalScript) - full HUD, menus, notifications using TweenService
7. ClientController (StarterPlayerScripts LocalScript) - input, RemoteEvent connections, mobile support
8. Config (ReplicatedStorage ModuleScript) - all game constants

RULES:
- Every script COMPLETE with no placeholders or TODOs
- MapBuilder must build a real detailed map with terrain, structures, and props
- Use pcall() around all DataStore operations
- Validate all RemoteEvent inputs on server
- Use WaitForChild() on client for RemoteEvents
- Mobile-friendly touch controls where needed
${assetContext}`
}

function safeJsonParse(raw) {
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e1) {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch (e2) {
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
    } catch {}

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
