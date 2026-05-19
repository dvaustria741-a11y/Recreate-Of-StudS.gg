import { getSession } from '../../lib/session'

// ─────────────────────────────────────────────────────────────────────────────
// Search Roblox Creator Store for free models matching keywords
// Returns an array of { id, name } for the AI to reference in scripts
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Build a proper .rbxl place file — scripts are nested inside their services
// ─────────────────────────────────────────────────────────────────────────────
function buildRbxl(scripts) {
  let refCounter = 0
  const ref = () => `RBX${String(refCounter++).padStart(8, '0')}`

  const escape = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  // Group scripts by location
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

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — no script cap, map + UI + lighting + asset integration
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(freeAssets) {
  const assetContext = freeAssets.length > 0
    ? `\n\nFREE ROBLOX CREATOR STORE ASSETS YOU CAN USE (InsertService:LoadAsset(id)):\n` +
      freeAssets.map(a => `- "${a.name}" (id: ${a.id}) [search: ${a.keyword}]`).join('\n') +
      `\n\nIn your MapBuilder script, load relevant assets with:\n` +
      `local model = game:GetService("InsertService"):LoadAsset(ASSET_ID)\n` +
      `model.Parent = workspace`
    : ''

  return `You are a senior Roblox game developer with 10 years of experience shipping AAA Roblox titles. You write production-quality Luau that other developers would be proud of.

Return ONLY a raw JSON object — no markdown, no code fences, no preamble, no explanation. Raw JSON only.

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
      "code": "string"
    }
  ],
  "setupSteps": ["string"]
}

REQUIRED SCRIPTS — you must generate ALL of these categories, no exceptions:

1. CORE SYSTEMS (as many as needed — no limit):
   - GameManager (server): round logic, game states, win/lose conditions
   - PlayerDataManager (server): DataStore saving/loading player stats with auto-save every 60s and on leave
   - EventsSetup (server): create all RemoteEvents and RemoteFunctions in ReplicatedStorage
   - Any additional server systems the game needs (economy, combat, trading, pets, etc.)

2. MAP BUILDER (required — 1 Script in ServerScriptService):
   - Name it "MapBuilder"
   - Use workspace.Terrain:FillBlock() and workspace.Terrain:FillCylinder() to create terrain
   - Use Instance.new("Part") to build structures, buildings, platforms, props
   - Set colors using BrickColor and Material enums that match the game theme
   - Use math.random for natural variation in placement
   - Anchor all parts with part.Anchored = true
   - Create named folders in Workspace to organize map elements
   - If free assets are available above, load them with InsertService
   - Build a map that matches the game description fully — do not use placeholder geometry

3. LIGHTING & ATMOSPHERE (required — 1 Script in Lighting, name it "LightingSetup"):
   - Must set game.Lighting properties: Ambient, OutdoorAmbient, Brightness, ClockTime, FogEnd, FogColor, SkyboxBk/Dn/Ft/Lf/Rt/Up
   - Create Atmosphere instance: Density, Offset, Color, Decay, Glare, Haze
   - Create ColorCorrection: Brightness, Contrast, Saturation, TintColor
   - Create Bloom: Intensity, Size, Threshold
   - Create SunRays if applicable: Intensity, Spread
   - Match the mood: horror = dark red fog, low brightness; tycoon = warm sunny; sci-fi = blue/cyan cold light; fantasy = golden warm; etc.

4. COMPLETE UI SYSTEM (required — 1 LocalScript in StarterGui, name it "UIManager"):
   - Build the FULL UI entirely in Luau code — no external assets needed
   - Create a main ScreenGui with ResetOnSpawn = false
   - Build every UI element the game needs: HUD, menus, shops, inventory, leaderboard, notifications
   - Style guidelines (MANDATORY — must follow):
     * Use rounded corners: UICorner with CornerRadius = UDim.new(0, 8) on all frames
     * Drop shadows: duplicate frame offset by 2px, black, 0.5 transparency, ZIndex -1
     * Primary color from game theme (horror = dark red, tycoon = gold, etc.)
     * Fonts: use Enum.Font.GothamBold for headers, Enum.Font.Gotham for body
     * Smooth tweening: TweenService for all animations (open/close menus, notifications sliding in)
     * No default Roblox GUI look — custom everything
     * HUD must show: player stats relevant to the game, minimap placeholder, current objective
     * Notifications system: sliding panels from top-right, auto-dismiss after 3 seconds

5. CLIENT CONTROLLER (required — 1 LocalScript in StarterPlayerScripts, name it "ClientController"):
   - Handle all client-side input (UserInputService, ContextActionService)
   - Connect RemoteEvents from server
   - Handle character spawn, camera setup
   - Mobile-friendly: add touch buttons if the game needs them

6. CHARACTER CONTROLLER if needed (StarterCharacterScripts):
   - Custom movement, animations, abilities

7. MODULE SCRIPTS in ReplicatedStorage:
   - Config module: all game constants (speeds, prices, timers, etc.)
   - Utility functions shared between client and server

ADDITIONAL RULES:
- Every script must be COMPLETE — no "-- TODO", no "-- add your code here", no placeholders
- Write as many scripts as the game genuinely needs — a complex MMO should have 20+ scripts
- All RemoteEvents must be created in EventsSetup BEFORE any other script tries to use them
  (use script.Parent:WaitForChild() on the client side)
- Use pcall() around all DataStore operations
- Use CollectionService tags for tagging game objects
- Characters should use Humanoid events properly
- Anti-cheat: validate all RemoteEvent inputs on the server
- Code style: PascalCase for instances, camelCase for variables, UPPER_CASE for constants
- Add section comments like -- // SECTION NAME // -- to organize long scripts
${assetContext}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { prompt } = req.body
  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'Prompt too short' })
  }

  try {
    // Step 1: Quick keyword extraction using a cheap OpenRouter model
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

    // Step 2: Generate full game — try models in order until one works
    // Free models (marked :free) have no cost, paid ones are fallbacks for quality
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
            max_tokens: 65536,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Create this complete Roblox game. Be thorough — generate every script needed for a polished, shippable game:\n\n${prompt}` },
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

        // OpenRouter sometimes wraps errors inside a 200
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
        error: `All AI models failed. ${lastError}. Check your OPENROUTER_API_KEY in Vercel environment variables.`,
      })
    }

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const game = JSON.parse(cleaned)
    game.modelUsed = modelUsed

    // Attach free asset info for display in UI
    game.freeAssetsUsed = freeAssets

    // Build the .rbxl place file
    game.rbxl = buildRbxl(game.scripts || [])

    return res.status(200).json({ game })

  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
