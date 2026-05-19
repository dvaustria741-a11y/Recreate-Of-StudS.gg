import { useState, useEffect } from 'react'
import Head from 'next/head'

const CYAN = '#00b4ff'
const BG = '#0a0a0a'
const CARD = '#111111'
const BORDER = '#1c1c1c'

const EXAMPLES = [
  'A zombie survival game where players defend a base using barricades and weapons',
  'An obby with 30 stages, moving platforms, and checkpoint saving',
  'A coin-collecting tycoon where you expand your island empire',
  'A battle royale with a shrinking safe zone and loot drops',
  'A pet simulator where you hatch eggs, level up pets, and trade them',
  'A horror escape room where players solve puzzles to flee a haunted mansion',
]

const CHIPS = ['Obby', 'Tycoon', 'Simulator', 'Battle Royale', 'Horror', 'Racing']

function StudsLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="18" fill={CYAN} />
      <path d="M50 8 L92 50 L50 92 L8 50 Z" fill="#0a0a0a" />
      <path d="M50 24 L76 50 L50 76 L24 50 Z" fill={CYAN} />
      <path d="M50 36 L64 50 L50 64 L36 50 Z" fill="#0a0a0a" />
    </svg>
  )
}

function Spinner({ color = '#000' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16"
      style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0, color }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"
        fill="none" strokeDasharray="24" strokeDashoffset="8" strokeLinecap="round" />
    </svg>
  )
}

function TypePill({ type }) {
  const map = {
    Script:       ['#0d2a1a', '#22c55e', '#16532e'],
    LocalScript:  ['#0d1a2e', CYAN,      '#0e3a5e'],
    ModuleScript: ['#1a0d2e', '#a855f7', '#3b1a6b'],
  }
  const [bg, color, border] = map[type] || map.Script
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 4,
      background: bg, color, border: `1px solid ${border}`,
      letterSpacing: '0.04em', fontFamily: 'monospace', whiteSpace: 'nowrap',
    }}>{type}</span>
  )
}

function Avatar({ user }) {
  if (user.avatar) {
    return (
      <img src={user.avatar} alt={user.username}
        style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${CYAN}` }} />
    )
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: '#001a2e', border: `2px solid ${CYAN}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: CYAN,
    }}>
      {user.username?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function Nav({ user, onReset }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60, borderBottom: `1px solid ${BORDER}`,
      position: 'sticky', top: 0, background: BG, zIndex: 20,
    }}>
      <div onClick={onReset} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 20, fontWeight: 900, color: '#fff',
        letterSpacing: '-0.01em', cursor: 'pointer',
      }}>
        <StudsLogo size={34} />
        STUD<span style={{ color: CYAN }}>S</span>
        <span style={{ color: '#333', fontWeight: 400, fontSize: 13 }}>.gg</span>
      </div>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar user={user} />
          <span style={{ fontSize: 13, color: '#888' }}>{user.username}</span>
          <a href="/api/auth/logout" style={{
            fontSize: 12, color: '#444', textDecoration: 'none',
            padding: '5px 12px', border: `1px solid ${BORDER}`,
            borderRadius: 6,
          }}>Log out</a>
        </div>
      ) : (
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: '#001a2e', color: CYAN,
          border: `1px solid #0077aa`,
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700,
        }}>AI-Powered</span>
      )}
    </nav>
  )
}

function LoginScreen({ error }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: 32,
    }}>
      <StudsLogo size={80} />
      <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginTop: 24, marginBottom: 10, letterSpacing: '-0.02em' }}>
        STU<span style={{ color: CYAN }}>D</span>S<span style={{ color: '#555', fontWeight: 400 }}>.gg</span>
      </h1>
      <p style={{ fontSize: 15, color: '#555', marginBottom: 36, lineHeight: 1.7 }}>
        Describe your Roblox game.<br />AI builds the Luau scripts. In seconds.
      </p>

      {error && (
        <div style={{
          background: '#1a0808', border: '1px solid #5c1a1a',
          borderRadius: 8, padding: '10px 18px', color: '#f87171',
          fontSize: 13, marginBottom: 20,
        }}>
          {error === 'access_denied' ? 'You cancelled the Roblox login.' :
           error === 'invalid_state' ? 'Security check failed. Please try again.' :
           'Something went wrong. Please try again.'}
        </div>
      )}

      <a href="/api/auth/login" style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: '14px 32px', borderRadius: 12,
        background: CYAN, color: '#000',
        fontWeight: 800, fontSize: 16, textDecoration: 'none',
        letterSpacing: '0.01em',
      }}>
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#000" />
          <path d="M20 4 L36 20 L20 36 L4 20 Z" fill={CYAN} />
          <path d="M20 11 L29 20 L20 29 L11 20 Z" fill="#000" />
          <path d="M20 15 L25 20 L20 25 L15 20 Z" fill={CYAN} />
        </svg>
        Sign in with Roblox
      </a>

      <p style={{ fontSize: 12, color: '#333', marginTop: 20 }}>
        We only read your username and avatar. We never post on your behalf.
      </p>
    </div>
  )
}

function BuildingScreen({ prompt, dots }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '78vh', gap: 24, textAlign: 'center', padding: 32,
    }}>
      <div style={{ animation: 'pulse 2s ease-in-out infinite' }}>
        <StudsLogo size={72} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Building your game{dots}</div>
        <div style={{ fontSize: 14, color: '#444', marginTop: 6 }}>AI is writing your Luau scripts</div>
      </div>
      <div style={{ width: 300, height: 3, background: '#1c1c1c', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: CYAN, borderRadius: 2, animation: 'progress 3s ease-in-out infinite' }} />
      </div>
      <div style={{ fontSize: 13, color: '#2a5a6a', maxWidth: 380, fontStyle: 'italic' }}>"{prompt}"</div>
    </div>
  )
}

function ResultScreen({ game, onReset }) {
  const [activeScript, setActiveScript] = useState(0)
  const [tab, setTab] = useState('scripts')
  const [copied, setCopied] = useState(null)

  const copy = async (text, id) => {
    try { await navigator.clipboard.writeText(text) } catch {}
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadRbxmx = () => {
    const blob = new Blob([game.rbxmx], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${game.gameName || 'game'}.rbxmx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const s = (game.scripts || [])[activeScript] || {}

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#2a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Generated Game</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{game.gameName}</h2>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>{game.gameDescription}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {(game.features || []).map((f, i) => (
            <span key={i} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              background: '#001a2e', color: CYAN, border: `1px solid #0a3a5a`,
            }}>{f}</span>
          ))}
        </div>
        <button onClick={downloadRbxmx} style={{
          padding: '10px 20px', borderRadius: 8,
          background: CYAN, color: '#000', border: 'none',
          fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>⬇ Download .rbxmx</button>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
        {['scripts', 'setup'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none',
            borderBottom: tab === t ? `2px solid ${CYAN}` : '2px solid transparent',
            color: tab === t ? CYAN : '#444', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'scripts' && (
        <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(game.scripts || []).map((sc, i) => (
              <button key={i} onClick={() => setActiveScript(i)} style={{
                padding: '6px 14px', borderRadius: 7, border: `1px solid ${i === activeScript ? CYAN : BORDER}`,
                background: i === activeScript ? '#001a2e' : 'transparent',
                color: i === activeScript ? CYAN : '#555',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace',
              }}>{sc.name}</button>
            ))}
          </div>

          {s.name && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px', background: '#0d0d0d',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', fontFamily: 'monospace' }}>{s.name}</span>
                  <TypePill type={s.type} />
                  <span style={{ fontSize: 11, color: '#333', fontFamily: 'monospace' }}>{s.location}</span>
                </div>
                <button onClick={() => copy(s.code, s.name)} style={{
                  padding: '4px 12px', borderRadius: 6, border: `1px solid ${BORDER}`,
                  background: 'transparent', color: copied === s.name ? '#22c55e' : '#555',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>{copied === s.name ? '✓ Copied' : 'Copy'}</button>
              </div>
              <div style={{ fontSize: 11, color: '#444', padding: '8px 16px', borderBottom: `1px solid ${BORDER}` }}>{s.description}</div>
              <pre style={{
                margin: 0, padding: '16px 20px', overflowX: 'auto',
                fontSize: 12, lineHeight: 1.7, color: '#a8d8a8',
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                maxHeight: 420,
              }}>{s.code}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'setup' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            {(game.setupSteps || []).map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: CYAN, color: '#000',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: '#0d0d0d', borderRadius: 8, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 11, color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>Script placement</div>
            {(game.scripts || []).map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0',
                borderBottom: i < game.scripts.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <span style={{ flex: 1, fontSize: 13, color: '#e8e8e8', fontFamily: 'monospace' }}>{s.name}</span>
                <TypePill type={s.type} />
                <span style={{ fontSize: 11, color: '#333', fontFamily: 'monospace' }}>→ {s.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <button onClick={onReset} style={{
          padding: '9px 20px', borderRadius: 8,
          background: 'transparent', border: `1px solid ${BORDER}`,
          color: '#555', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>← Build Another Game</button>
      </div>
    </div>
  )
}

function HomeScreen({ user }) {
  const [prompt, setPrompt] = useState('')
  const [screen, setScreen] = useState('home')
  const [game, setGame] = useState(null)
  const [error, setError] = useState('')
  const [exIdx, setExIdx] = useState(0)
  const [dots, setDots] = useState('.')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setExIdx(i => (i + 1) % EXAMPLES.length), 3500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(t)
  }, [loading])

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError('')
    setGame(null)
    setScreen('building')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGame(data.game)
      setScreen('result')
    } catch (e) {
      setError(e.message || 'Something went wrong')
      setScreen('home')
    }
    setLoading(false)
  }

  const reset = () => { setScreen('home'); setGame(null); setPrompt(''); setError('') }

  if (screen === 'building') return <BuildingScreen prompt={prompt} dots={dots} />
  if (screen === 'result') return <ResultScreen game={game} onReset={reset} />

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <StudsLogo size={64} />
      </div>
      <h1 style={{
        fontSize: 46, fontWeight: 900, lineHeight: 1.1,
        letterSpacing: '-0.03em', color: '#fff', marginBottom: 14,
      }}>
        Describe it.<br />
        <span style={{ color: CYAN }}>AI builds it.</span><br />
        Download it.
      </h1>
      <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 36 }}>
        Turn your Roblox game idea into real, working Luau scripts — in seconds.<br />
        No coding required.
      </p>

      <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', textAlign: 'left' }}>
        <div style={{
          padding: '10px 16px', background: '#0d0d0d',
          borderBottom: `1px solid ${BORDER}`,
          fontSize: 12, color: '#2a6a8a', fontStyle: 'italic',
        }}>
          e.g. {EXAMPLES[exIdx]}
        </div>
        <textarea
          style={{
            width: '100%', minHeight: 108,
            background: 'transparent', border: 'none',
            color: '#e8e8e8', fontSize: 15, lineHeight: 1.65,
            padding: '16px 20px', resize: 'none', outline: 'none',
            fontFamily: 'inherit',
          }}
          placeholder="Describe your Roblox game in detail… include mechanics, style, and what makes it fun."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
        />
        {error && (
          <div style={{
            background: '#1a0808', borderTop: '1px solid #5c1a1a',
            padding: '10px 16px', color: '#f87171', fontSize: 13,
          }}>{error}</div>
        )}
        <div style={{
          padding: '10px 16px', background: '#0d0d0d',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#333' }}>Ctrl+Enter to generate</span>
          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 9,
              border: 'none', cursor: !prompt.trim() || loading ? 'not-allowed' : 'pointer',
              background: CYAN, color: '#000',
              fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              opacity: !prompt.trim() || loading ? 0.35 : 1,
            }}>
            {loading ? <><Spinner />&nbsp;Building…</> : 'Build Game →'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
        {CHIPS.map((tag, i) => (
          <button key={tag}
            onClick={() => setPrompt(EXAMPLES[i % EXAMPLES.length])}
            style={{
              padding: '5px 16px', borderRadius: 20,
              background: 'transparent', border: `1px solid ${BORDER}`,
              color: '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>{tag}</button>
        ))}
      </div>

      <div style={{ marginTop: 44, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
        {['Logged in with Roblox', 'Real working Luau', 'Download as .rbxmx'].map(f => (
          <span key={f} style={{ fontSize: 12, color: '#333', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: CYAN }}>✓</span>{f}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Page({ user, error }) {
  const [currentScreen, setCurrentScreen] = useState('main')
  const handleReset = () => setCurrentScreen('main')

  return (
    <>
      <Head>
        <title>STUDS.gg — AI Roblox Game Builder</title>
        <meta name="description" content="Describe your Roblox game. AI builds the Luau scripts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Nav user={user} onReset={handleReset} />
      {user ? <HomeScreen user={user} /> : <LoginScreen error={error} />}
    </>
  )
}

export async function getServerSideProps({ req, query }) {
  const { getSession } = await import('../lib/session')
  const session = getSession(req)
  return {
    props: {
      user: session ? { userId: session.userId, username: session.username, avatar: session.avatar || null } : null,
      error: query.error || null,
    }
  }
}
