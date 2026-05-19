import { getSession } from '../../lib/session'

// ─── Roblox Creator Store asset search ───────────────────────────────────────
async function searchFreeModels(keywords) {
  const results = []
  for (const keyword of keywords.slice(0, 4)) {
    try {
      const url = `https://catalog.roblox.com/v1/search/items?category=Models&keyword=${encodeURIComponent(keyword)}&limit=5&minPrice=0&maxPrice=0&salesTypeFilter=1`
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok) continue
      const data = await res.json()
      for (const item of (data.data || []).slice(0, 3)) {
        if (item.id && item.name) results.push({ id: item.id, name: item.name, keyword })
      }
    } catch {}
  }
  return results
}

// ─── BrickColor name → Roblox number ─────────────────────────────────────────
const BRICK_COLORS = {
  white:1, grey:9, gray:9, darkgrey:26, darkgray:26, black:26,
  brown:192, tan:5, red:21, darkred:154, orange:25, yellow:24,
  lime:37, green:28, darkgreen:28, cyan:107, blue:23, darkblue:141,
  purple:101, pink:104, sand:11, concrete:9, metal:9, gold:24, silver:9,
}
const brickColorNum = n => BRICK_COLORS[(n||'').toLowerCase().replace(/\s/g,'')] || 194

// ─── Material name → Roblox token ────────────────────────────────────────────
const MATERIALS = {
  smooth:256, plastic:256, wood:512, woodplanks:512, concrete:816,
  slate:800, cobblestone:804, brick:848, grass:1280, ground:1284,
  sand:1288, rock:832, snow:1296, ice:1536, metal:1088, foil:1072,
  corrodedmetal:1184, diamondplate:1104, fabric:1632, glass:1568, neon:1664,
}
const materialToken = n => MATERIALS[(n||'').toLowerCase().replace(/\s/g,'')] || 256

// ─── Ref counter ──────────────────────────────────────────────────────────────
let _r = 0
const R = () => `RBX${String(_r++).padStart(8,'0')}`

// ─── Single Part → XML ────────────────────────────────────────────────────────
function partXml(p) {
  const x=p.x??0, y=p.y??0, z=p.z??0
  const sx=p.sx??4, sy=p.sy??4, sz=p.sz??4
  const ry=(p.ry??0)*Math.PI/180
  const cos=Math.cos(ry), sin=Math.sin(ry)
  const shape = p.shape==='sphere'?1 : p.shape==='cylinder'?3 : 0
  const name = String(p.name||'Part').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  return `
    <Item class="Part" referent="${R()}">
      <Properties>
        <string name="Name">${name}</string>
        <bool name="Anchored">${p.anchored!==false}</bool>
        <bool name="Locked">false</bool>
        <bool name="CastShadow">${p.castShadow!==false}</bool>
        <token name="Shape">${shape}</token>
        <Vector3 name="Size"><X>${sx}</X><Y>${sy}</Y><Z>${sz}</Z></Vector3>
        <CoordinateFrame name="CFrame">
          <X>${x}</X><Y>${y}</Y><Z>${z}</Z>
          <R00>${cos}</R00><R01>0</R01><R02>${sin}</R02>
          <R10>0</R10><R11>1</R11><R12>0</R12>
          <R20>${-sin}</R20><R21>0</R21><R22>${cos}</R22>
        </CoordinateFrame>
        <BrickColor name="BrickColor">${brickColorNum(p.color)}</BrickColor>
        <token name="Material">${materialToken(p.material)}</token>
        <float name="Reflectance">${p.reflectance??0}</float>
        <float name="Transparency">${p.transparency??0}</float>
      </Properties>
    </Item>`
}

// ─── Lighting service → XML ───────────────────────────────────────────────────
function lightingXml(L) {
  const a=L.ambient||[0.5,0.5,0.5]
  const o=L.outdoorAmbient||[0.5,0.5,0.5]
  const fc=L.fogColor||[0.75,0.75,0.75]
  const atm=L.atmosphere||{}
  const ac=atm.color||[0.8,0.9,1], ad=atm.decay||[1,1,1]
  const cc=L.colorCorrection||{}
  const ct=cc.tintColor||[1,1,1]
  const bl=L.bloom||{}
  const sr=L.sunRays||{}
  return `
    <Item class="Lighting" referent="${R()}">
      <Properties>
        <string name="Name">Lighting</string>
        <Color3 name="Ambient"><R>${a[0]}</R><G>${a[1]}</G><B>${a[2]}</B></Color3>
        <Color3 name="OutdoorAmbient"><R>${o[0]}</R><G>${o[1]}</G><B>${o[2]}</B></Color3>
        <float name="Brightness">${L.brightness??2}</float>
        <float name="ClockTime">${L.clockTime??14}</float>
        <float name="FogEnd">${L.fogEnd??100000}</float>
        <float name="FogStart">${L.fogStart??0}</float>
        <Color3 name="FogColor"><R>${fc[0]}</R><G>${fc[1]}</G><B>${fc[2]}</B></Color3>
        <bool name="GlobalShadows">${L.globalShadows!==false}</bool>
        <token name="Technology">4</token>
      </Properties>
      <Item class="Atmosphere" referent="${R()}">
        <Properties>
          <string name="Name">Atmosphere</string>
          <float name="Density">${atm.density??0.3}</float>
          <float name="Offset">${atm.offset??0.25}</float>
          <float name="Glare">${atm.glare??0}</float>
          <float name="Haze">${atm.haze??0}</float>
          <Color3 name="Color"><R>${ac[0]}</R><G>${ac[1]}</G><B>${ac[2]}</B></Color3>
          <Color3 name="Decay"><R>${ad[0]}</R><G>${ad[1]}</G><B>${ad[2]}</B></Color3>
        </Properties>
      </Item>
      <Item class="ColorCorrectionEffect" referent="${R()}">
        <Properties>
          <string name="Name">ColorCorrection</string>
          <float name="Brightness">${cc.brightness??0}</float>
          <float name="Contrast">${cc.contrast??0}</float>
          <float name="Saturation">${cc.saturation??0}</float>
          <Color3 name="TintColor"><R>${ct[0]}</R><G>${ct[1]}</G><B>${ct[2]}</B></Color3>
          <bool name="Enabled">true</bool>
        </Properties>
      </Item>
      ${bl.enabled!==false?`
      <Item class="BloomEffect" referent="${R()}">
        <Properties>
          <string name="Name">Bloom</string>
          <float name="Intensity">${bl.intensity??0.5}</float>
          <float name="Size">${bl.size??24}</float>
          <float name="Threshold">${bl.threshold??0.95}</float>
          <bool name="Enabled">true</bool>
        </Properties>
      </Item>`:''}
      ${sr.enabled!==false?`
      <Item class="SunRaysEffect" referent="${R()}">
        <Properties>
          <string name="Name">SunRays</string>
          <float name="Intensity">${sr.intensity??0.25}</float>
          <float name="Spread">${sr.spread??0.5}</float>
          <bool name="Enabled">true</bool>
        </Properties>
      </Item>`:''}
    </Item>`
}

// ─── Full .rbxl ───────────────────────────────────────────────────────────────
function buildRbxl(scripts, mapParts, lighting) {
  _r = 0
  const remapped = scripts.map(s => ({
    ...s,
    location: s.location==='Lighting' ? 'ServerScriptService' : s.location,
  }))
  const byLoc = {}
  for (const s of remapped) {
    const loc = s.location || 'ServerScriptService'
    if (!byLoc[loc]) byLoc[loc] = []
    byLoc[loc].push(s)
  }
  const esc = str => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const scriptXml = s => `
    <Item class="${s.type}" referent="${R()}">
      <Properties>
        <string name="Name">${esc(s.name)}</string>
        <ProtectedString name="Source"><![CDATA[${s.code}]]></ProtectedString>
        <bool name="Disabled">false</bool>
      </Properties>
    </Item>`
  const svc = loc => (byLoc[loc]||[]).map(scriptXml).join('')
  const mapXml = (mapParts||[]).map(partXml).join('')

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="DataModel" referent="${R()}">
    <Properties><string name="Name">Place</string></Properties>

    <Item class="Workspace" referent="${R()}">
      <Properties>
        <string name="Name">Workspace</string>
        <bool name="FilteringEnabled">true</bool>
        <float name="Gravity">196.2</float>
      </Properties>
      <Item class="Terrain" referent="${R()}">
        <Properties><string name="Name">Terrain</string></Properties>
      </Item>
      <Item class="Part" referent="${R()}">
        <Properties>
          <string name="Name">Baseplate</string>
          <bool name="Anchored">true</bool><bool name="Locked">true</bool>
          <token name="Shape">0</token>
          <Vector3 name="Size"><X>512</X><Y>20</Y><Z>512</Z></Vector3>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>-10</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
          <BrickColor name="BrickColor">194</BrickColor>
          <token name="Material">1280</token>
        </Properties>
      </Item>
      <Item class="SpawnLocation" referent="${R()}">
        <Properties>
          <string name="Name">SpawnLocation</string>
          <bool name="Anchored">true</bool>
          <Vector3 name="Size"><X>6</X><Y>1</Y><Z>6</Z></Vector3>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>1</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
          <BrickColor name="BrickColor">37</BrickColor>
          <bool name="Neutral">true</bool><float name="Duration">0</float>
        </Properties>
      </Item>
      ${mapXml}
      ${svc('Workspace')}
    </Item>

    ${lightingXml(lighting||{})}

    <Item class="ReplicatedStorage" referent="${R()}">
      <Properties><string name="Name">ReplicatedStorage</string></Properties>
      ${svc('ReplicatedStorage')}
    </Item>
    <Item class="ServerScriptService" referent="${R()}">
      <Properties><string name="Name">ServerScriptService</string></Properties>
      ${svc('ServerScriptService')}
    </Item>
    <Item class="StarterGui" referent="${R()}">
      <Properties><string name="Name">StarterGui</string><bool name="ResetPlayerGuiOnSpawn">false</bool></Properties>
      ${svc('StarterGui')}
    </Item>
    <Item class="StarterPlayer" referent="${R()}">
      <Properties><string name="Name">StarterPlayer</string></Properties>
      <Item class="StarterPlayerScripts" referent="${R()}">
        <Properties><string name="Name">StarterPlayerScripts</string></Properties>
        ${svc('StarterPlayerScripts')}
      </Item>
      <Item class="StarterCharacterScripts" referent="${R()}">
        <Properties><string name="Name">StarterCharacterScripts</string></Properties>
        ${svc('StarterCharacterScripts')}
      </Item>
    </Item>
  </Item>
</roblox>`
}

// ─── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(freeAssets) {
  const assetNote = freeAssets.length > 0
    ? `\nFREE ROBLOX ASSETS (use in scripts via InsertService:LoadAsset(id)):\n` +
      freeAssets.map(a => `  ${a.id}: "${a.name}"`).join('\n')
    : ''
  return `You are a senior Roblox game developer. Generate a complete Roblox game as raw JSON only — no markdown, no code fences.

JSON structure:
{
  "gameName": "string",
  "gameDescription": "string",
  "genre": "string",
  "features": ["string"],
  "lighting": {
    "ambient": [R,G,B], "outdoorAmbient": [R,G,B],
    "brightness": number, "clockTime": number,
    "fogEnd": number, "fogStart": number, "fogColor": [R,G,B],
    "globalShadows": true,
    "atmosphere": { "density":number,"offset":number,"glare":number,"haze":number,"color":[R,G,B],"decay":[R,G,B] },
    "colorCorrection": { "brightness":number,"contrast":number,"saturation":number,"tintColor":[R,G,B] },
    "bloom": { "enabled":true,"intensity":number,"size":number,"threshold":number },
    "sunRays": { "enabled":true,"intensity":number,"spread":number }
  },
  "mapParts": [
    { "name":"string","x":number,"y":number,"z":number,"sx":number,"sy":number,"sz":number,"ry":number,"color":"colorName","material":"materialName","transparency":number,"reflectance":number,"shape":"block|sphere|cylinder","anchored":true }
  ],
  "scripts": [
    { "name":"string","type":"Script|LocalScript|ModuleScript","location":"ServerScriptService|StarterPlayerScripts|StarterGui|ReplicatedStorage|Workspace|StarterCharacterScripts","description":"string","code":"string" }
  ],
  "setupSteps": ["string"]
}

LIGHTING — match mood to genre (all RGB values 0.0–1.0):
- Horror: clockTime=0, brightness=0.3, fogEnd=200, dense dark red fog, heavy atmosphere
- Tycoon: clockTime=14, brightness=3, warm golden, sunRays enabled, low fog
- Obby: clockTime=12, bright, colourful, minimal fog
- Sci-fi: clockTime=2, blue-cyan ambient, neon bloom, low brightness
- Fantasy: clockTime=10, warm golden, soft haze, sunRays
- Battle Royale: clockTime=8, overcast grey, medium fog

MAP — generate 40–80 parts for a real playable level:
- Include: ground floor, walls/fences for boundaries, at least 3 distinct buildings or zones, props (crates, barrels, trees made of stacked parts), paths
- Vary Y heights for interesting terrain
- Named clearly: "Wall_North", "Building_A", "Tree_01", "Crate_01"
- All anchored: true
- Colors: white,grey,darkgrey,black,brown,tan,red,darkred,orange,yellow,lime,green,darkgreen,cyan,blue,darkblue,purple,pink,sand,concrete,metal,gold
- Materials: smooth,wood,woodplanks,concrete,slate,cobblestone,brick,grass,ground,sand,rock,snow,ice,metal,glass,neon,fabric

SCRIPTS — do NOT write MapBuilder or LightingSetup (those are handled):
1. EventsSetup — Script in ServerScriptService — create all RemoteEvents/RemoteFunctions
2. GameManager — Script in ServerScriptService — game loop, rounds, win/lose
3. PlayerDataManager — Script in ServerScriptService — DataStore, pcall, auto-save 60s
4. UIManager — LocalScript in StarterGui — full HUD: health bar, stats display, notifications sliding from top-right with TweenService, menus — Gotham fonts, UICorner radius 8, no default Roblox style
5. ClientController — LocalScript in StarterPlayerScripts — input, RemoteEvent hooks, mobile buttons
6. Config — ModuleScript in ReplicatedStorage — all constants
7. Extra scripts for game-specific systems (combat, economy, pets, etc.)

All scripts must be COMPLETE with no TODOs. Use WaitForChild on client. pcall on DataStore. Validate server-side.
${assetNote}`
}

// ─── JSON parse with fallback ─────────────────────────────────────────────────
function safeJsonParse(raw) {
  const c = raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim()
  try { return JSON.parse(c) } catch {}
  const s=c.indexOf('{'), e=c.lastIndexOf('}')
  if (s!==-1&&e!==-1) { try { return JSON.parse(c.slice(s,e+1)) } catch {} }
  throw new Error('Could not parse AI response as JSON — try again')
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not logged in' })
  const { prompt } = req.body
  if (!prompt || prompt.trim().length < 5) return res.status(400).json({ error: 'Prompt too short' })

  try {
    // Step 1: Asset keywords (best-effort, cheap model)
    let freeAssets = []
    try {
      const kwRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer':process.env.NEXT_PUBLIC_APP_URL||'https://studs.gg', 'X-Title':'Studs.gg' },
        body: JSON.stringify({ model:'google/gemini-2.0-flash-lite-001', max_tokens:100, temperature:0.2,
          messages:[{role:'user',content:`Roblox game: "${prompt}". Give 4 short keywords for free 3D model search. JSON array only.`}] }),
      })
      if (kwRes.ok) {
        const d = await kwRes.json()
        const kw = JSON.parse((d.choices?.[0]?.message?.content||'[]').replace(/```(?:json)?/g,'').trim())
        if (Array.isArray(kw)) freeAssets = await searchFreeModels(kw)
      }
    } catch {}

    // Step 2: Generate game — try models in order
    const MODELS = [
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-4-maverick:free',
      'meta-llama/llama-4-scout:free',
      'google/gemini-2.0-flash-lite-001',
    ]

    let raw='', modelUsed='', lastError=''
    const headers = { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer':process.env.NEXT_PUBLIC_APP_URL||'https://studs.gg', 'X-Title':'Studs.gg' }

    for (const model of MODELS) {
      try {
        console.log(`Trying: ${model}`)
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method:'POST', headers,
          body: JSON.stringify({
            model, max_tokens:32000, temperature:0.4,
            response_format:{ type:'json_object' },
            messages:[
              { role:'system', content:buildSystemPrompt(freeAssets) },
              { role:'user', content:`Create this Roblox game with a detailed map (40-80 parts) and all required scripts:\n\n${prompt}` },
            ],
          }),
        })
        if (!orRes.ok) { const t=await orRes.text(); lastError=`${model} HTTP${orRes.status}: ${t.slice(0,200)}`; console.warn(lastError); continue }
        const d = await orRes.json()
        if (d.error) { lastError=`${model}: ${d.error.message}`; console.warn(lastError); continue }
        const text = d.choices?.[0]?.message?.content||''
        if (!text) { lastError=`${model}: empty`; console.warn(lastError); continue }
        raw=text; modelUsed=model; console.log(`Success: ${model}`); break
      } catch(err) { lastError=`${model}: ${err.message}`; console.warn(lastError); continue }
    }

    if (!raw) return res.status(502).json({ error:`All models failed. ${lastError}` })

    const game = safeJsonParse(raw)
    game.modelUsed = modelUsed
    game.freeAssetsUsed = freeAssets
    // Map and lighting baked directly into the .rbxl XML — no runtime scripts needed
    game.rbxl = buildRbxl(game.scripts||[], game.mapParts||[], game.lighting||{})

    return res.status(200).json({ game })

  } catch(err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error:'Server error: '+err.message })
  }
}
