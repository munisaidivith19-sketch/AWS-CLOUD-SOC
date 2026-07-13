import { useEffect, useState, useRef } from 'react'
import { getIncidents, assignIncident, resolveIncident } from '../services/api'

interface Incident {
  incident_id: string
  threat_id: string
  status: string
  severity: string
  event_type: string
  assigned_to?: string
  notes?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
  username?: string
  source_ip?: string
  region?: string
  mitre?: string
  ai_analysis?: string
  description?: string
  risk_score?: number
}

const SEV: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  HIGH:     { color: '#fb923c', bg: 'rgba(251,146,60,0.08)'  },
  MEDIUM:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
  LOW:      { color: '#34d399', bg: 'rgba(52,211,153,0.08)'  },
}

const ST_COLOR: Record<string, string> = {
  OPEN:           '#f87171',
  ASSIGNED:       '#60a5fa',
  IN_PROGRESS:    '#fbbf24',
  RESOLVED:       '#34d399',
  FALSE_POSITIVE: '#a78bfa',
  CLOSED:         '#6b7280',
}

// ── Binary / Data Protection Canvas (Incidents) ───────────
function BinaryCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight })

    // Falling binary columns
    const COLS  = Math.floor(W / 22)
    const drops = Array.from({ length: COLS }, () => Math.random() * -H)
    const speeds = Array.from({ length: COLS }, () => Math.random() * 1.2 + 0.4)
    const chars  = ['0','1','▓','░','■','□','◆']
    const colAlpha = Array.from({ length: COLS }, () => Math.random() * 0.12 + 0.04)

    // Floating shield icons (SVG-style drawn with canvas)
    interface Shield { x: number; y: number; r: number; vx: number; vy: number; alpha: number; pulse: number; pulseSpeed: number; color: string }
    const shieldColors = ['#3b82f6','#0ea5e9','#06b6d4','#38bdf8']
    const shields: Shield[] = Array.from({ length: 10 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 30 + 18,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.06 + 0.02,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.01 + 0.005,
      color: shieldColors[Math.floor(Math.random() * shieldColors.length)],
    }))

    // Wave rings
    interface Ring { x: number; y: number; r: number; maxR: number; alpha: number; color: string }
    const rings: Ring[] = []
    const spawnRing = () => rings.push({ x: Math.random() * W, y: Math.random() * H, r: 0, maxR: Math.random() * 80 + 40, alpha: 0.15, color: shieldColors[Math.floor(Math.random() * shieldColors.length)] })
    for (let i = 0; i < 5; i++) spawnRing()

    let tick = 0
    const draw = () => {
      tick++

      // Fade trail
      ctx.fillStyle = 'rgba(2,6,20,0.18)'
      ctx.fillRect(0, 0, W, H)

      // Full background (first frame)
      if (tick === 1) {
        ctx.fillStyle = '#020614'
        ctx.fillRect(0, 0, W, H)
      }

      // Binary columns
      ctx.font = '11px monospace'
      for (let c = 0; c < COLS; c++) {
        const x   = c * 22
        const y   = drops[c]
        const ch  = chars[Math.floor(Math.random() * chars.length)]

        // Head (bright)
        ctx.globalAlpha  = colAlpha[c] * 3
        ctx.fillStyle    = '#60a5fa'
        ctx.fillText(ch, x, y)

        // Body (dimmer)
        ctx.globalAlpha  = colAlpha[c]
        ctx.fillStyle    = '#1d4ed8'
        for (let j = 1; j < 6; j++) {
          const py = y - j * 22
          if (py > 0) ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, py)
        }
        ctx.globalAlpha = 1

        drops[c] += speeds[c] * 1.2
        if (drops[c] > H + 40) drops[c] = Math.random() * -H * 0.5
      }

      // Shield icons (glass effect)
      shields.forEach(sh => {
        sh.x += sh.vx; sh.y += sh.vy; sh.pulse += sh.pulseSpeed
        if (sh.x < -60) sh.x = W + 60
        if (sh.x > W + 60) sh.x = -60
        if (sh.y < -60) sh.y = H + 60
        if (sh.y > H + 60) sh.y = -60

        const scaleA = 1 + Math.sin(sh.pulse) * 0.06

        ctx.save()
        ctx.translate(sh.x, sh.y)
        ctx.scale(scaleA, scaleA)

        // Outer glow
        const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, sh.r * 2)
        g1.addColorStop(0, `${sh.color}${Math.round(sh.alpha * 1.5 * 255).toString(16).padStart(2,'0')}`)
        g1.addColorStop(1, sh.color + '00')
        ctx.fillStyle = g1
        ctx.beginPath(); ctx.arc(0, 0, sh.r * 2, 0, Math.PI * 2); ctx.fill()

        // Draw shield shape
        const sr = sh.r
        ctx.globalAlpha = sh.alpha * 3
        ctx.strokeStyle = sh.color
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.moveTo(0, -sr)
        ctx.bezierCurveTo(sr * 0.8, -sr * 0.8, sr, -sr * 0.2, sr, sr * 0.2)
        ctx.bezierCurveTo(sr, sr * 0.6, sr * 0.5, sr * 0.9, 0, sr)
        ctx.bezierCurveTo(-sr * 0.5, sr * 0.9, -sr, sr * 0.6, -sr, sr * 0.2)
        ctx.bezierCurveTo(-sr, -sr * 0.2, -sr * 0.8, -sr * 0.8, 0, -sr)
        ctx.closePath()
        ctx.stroke()

        // Inner scanline
        ctx.globalAlpha = sh.alpha * 1.5
        ctx.beginPath(); ctx.moveTo(-sr * 0.4, 0); ctx.lineTo(sr * 0.4, 0)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.restore()
      })

      // Wave rings
      rings.forEach((ring, idx) => {
        ring.r    += 0.7
        ring.alpha -= 0.0018

        ctx.globalAlpha  = ring.alpha
        ctx.strokeStyle  = ring.color
        ctx.lineWidth    = 0.8
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha  = 1

        if (ring.r >= ring.maxR || ring.alpha <= 0) {
          rings.splice(idx, 1)
          if (tick % 40 === 0) spawnRing()
        }
      })
      if (tick % 80 === 0) spawnRing()

      // Horizontal glow sweep
      const sweepX = ((tick * 0.35) % (W + 300)) - 150
      const swGrad = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, 0)
      swGrad.addColorStop(0,   'rgba(59,130,246,0)')
      swGrad.addColorStop(0.5, 'rgba(59,130,246,0.03)')
      swGrad.addColorStop(1,   'rgba(59,130,246,0)')
      ctx.fillStyle = swGrad; ctx.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }} />
}

// ── Glass stat card ───────────────────────────────────────
function GlassCard({ label, value, color, icon, delay = 0 }: { label: string; value: number; color: string; icon: string; delay?: number }) {
  return (
    <div style={{ position: 'relative', background: `${color}08`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${color}28`, borderRadius: '18px', padding: '20px 18px', overflow: 'hidden', animation: `fadeUp 0.5s ease ${delay}s both`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)`, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${color}22` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)` }}
    >
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
      <div style={{ position: 'absolute', top: '-28px', right: '-18px', width: '85px', height: '85px', borderRadius: '50%', background: `radial-gradient(circle,${color}22,transparent 70%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', margin: 0 }}>{label.toUpperCase()}</p>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <p style={{ color, fontSize: '36px', fontWeight: 800, margin: 0, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 20px ${color}77` }}>{value}</p>
      <div style={{ marginTop: '10px', height: '2px', background: `linear-gradient(90deg,${color},transparent)`, borderRadius: '999px', opacity: 0.5 }} />
    </div>
  )
}

export default function Incidents() {
  const [incidents,  setIncidents]  = useState<Incident[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filterSt,   setFilterSt]   = useState('')
  const [filterSev,  setFilterSev]  = useState('')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState<Incident | null>(null)
  const [assignTo,   setAssignTo]   = useState('')
  const [notes,      setNotes]      = useState('')
  const [resolveNote,setResolveNote]= useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [showResolve,setShowResolve]= useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getIncidents()
      setIncidents(res.data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = incidents.filter(i => {
    const mSt  = !filterSt  || i.status   === filterSt
    const mSev = !filterSev || i.severity  === filterSev
    const mS   = !search    || [i.incident_id, i.event_type, i.username||'', i.source_ip||''].join(' ').toLowerCase().includes(search.toLowerCase())
    return mSt && mSev && mS
  })

  const counts = {
    total:    incidents.length,
    open:     incidents.filter(i => i.status === 'OPEN').length,
    assigned: incidents.filter(i => i.status === 'ASSIGNED').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL').length,
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try { await assignIncident(selected.incident_id, assignTo, notes); await fetch(); setShowAssign(false); setAssignTo(''); setNotes('') } catch (err) { console.error(err) }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try { await resolveIncident(selected.incident_id, resolveNote, 'current_user'); await fetch(); setShowResolve(false); setResolveNote('') } catch (err) { console.error(err) }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .irow:hover { background: rgba(59,130,246,0.04) !important; cursor:pointer; }
      `}</style>

      <BinaryCanvas />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Header */}
        <div style={{ background: 'rgba(2,6,20,0.72)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '18px', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', animation: 'pulse 2.5s infinite' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5"/>
                <line x1="9"  y1="12"   x2="15" y2="12"   stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="10" y1="14.5" x2="14" y2="14.5" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
                <circle cx="12" cy="9" r="1.3" fill="#3b82f6"/>
              </svg>
            </div>
            <div>
              <h1 style={{ color: '#f0f9ff', fontSize: '17px', fontWeight: 700, margin: 0 }}>Incident Management</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0', letterSpacing: '0.08em' }}>
                SECURITY INCIDENT RESPONSE · {filtered.length} INCIDENTS
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetch} style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>↻ REFRESH</button>
            {counts.open > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 13px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: '10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f87171', boxShadow: '0 0 7px #f87171', animation: 'pulse 1.8s infinite' }} />
                <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>{counts.open} OPEN</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          <GlassCard label="Total"     value={counts.total}    color="#60a5fa" icon="📋" delay={0}    />
          <GlassCard label="Open"      value={counts.open}     color="#f87171" icon="🔓" delay={0.06} />
          <GlassCard label="Assigned"  value={counts.assigned} color="#60a5fa" icon="👤" delay={0.12} />
          <GlassCard label="Resolved"  value={counts.resolved} color="#34d399" icon="✅" delay={0.18} />
          <GlassCard label="Critical"  value={counts.critical} color="#f87171" icon="🚨" delay={0.24} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(2,6,20,0.62)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '14px', padding: '14px 18px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search incidents..."
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px', outline: 'none', width: '220px' }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['','OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','FALSE_POSITIVE','CLOSED'].map(s => (
              <button key={s} onClick={() => setFilterSt(s)}
                style={{ padding: '7px 12px', borderRadius: '9px', border: `1px solid ${filterSt === s ? (ST_COLOR[s] || '#60a5fa') : 'rgba(255,255,255,0.08)'}`, background: filterSt === s ? `${ST_COLOR[s] || '#60a5fa'}12` : 'rgba(255,255,255,0.03)', color: filterSt === s ? (ST_COLOR[s] || '#60a5fa') : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', backdropFilter: 'blur(8px)' }}>
                {s || 'ALL'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['','CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
              <button key={s} onClick={() => setFilterSev(s)}
                style={{ padding: '7px 12px', borderRadius: '9px', border: `1px solid ${filterSev === s ? (SEV[s]?.color || '#60a5fa') : 'rgba(255,255,255,0.08)'}`, background: filterSev === s ? `${SEV[s]?.bg || 'rgba(96,165,250,0.1)'}` : 'rgba(255,255,255,0.03)', color: filterSev === s ? (SEV[s]?.color || '#60a5fa') : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                {s || 'ALL SEV'}
              </button>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', alignSelf: 'center', marginLeft: 'auto' }}>
            {filtered.length} / {incidents.length} shown
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: '16px' }}>

          {/* Table */}
          <div style={{ background: 'rgba(2,6,20,0.68)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(59,130,246,0.14)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeUp 0.4s ease 0.28s both', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent)' }} />
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ color: 'rgba(59,130,246,0.6)', fontSize: '13px', letterSpacing: '0.12em' }}>LOADING INCIDENTS...</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(59,130,246,0.12)', background: 'rgba(59,130,246,0.03)' }}>
                    {['INCIDENT ID','THREAT ID','SEVERITY','EVENT TYPE','USER','SOURCE IP','STATUS','ASSIGNED TO','CREATED','ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: 'rgba(59,130,246,0.6)', letterSpacing: '0.1em', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 60).map((inc, i) => {
                    const s     = SEV[inc.severity] || SEV.LOW
                    const stCol = ST_COLOR[inc.status] || '#6b7280'
                    const isAct = selected?.incident_id === inc.incident_id
                    return (
                      <tr key={inc.incident_id} className="irow"
                        onClick={() => setSelected(isAct ? null : inc)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isAct ? 'rgba(59,130,246,0.07)' : 'transparent', transition: 'background 0.15s', animation: `fadeUp 0.25s ease ${Math.min(i,20)*0.025}s both` }}>
                        <td style={{ padding: '11px 12px', color: '#60a5fa', fontSize: '10px', fontFamily: 'monospace', fontWeight: 600 }}>{inc.incident_id}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}>{inc.threat_id}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30`, backdropFilter: 'blur(6px)' }}>{inc.severity}</span>
                        </td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.65)', fontSize: '11px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.event_type}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'monospace' }}>{inc.username || '—'}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace' }}>{inc.source_ip || '—'}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, color: stCol, background: `${stCol}12`, border: `1px solid ${stCol}28`, backdropFilter: 'blur(6px)' }}>{inc.status}</span>
                        </td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{inc.assigned_to || '—'}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{new Date(inc.created_at).toLocaleString().slice(0, 16)}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                            {inc.status !== 'RESOLVED' && (
                              <button onClick={() => { setSelected(inc); setShowAssign(true) }} style={{ padding: '3px 8px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Assign</button>
                            )}
                            {inc.status !== 'RESOLVED' && (
                              <button onClick={() => { setSelected(inc); setShowResolve(true) }} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>Resolve</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'rgba(59,130,246,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>
                      NO INCIDENTS FOUND · MONITORING ACTIVE<br/>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>Incidents are auto-created from HIGH and CRITICAL CloudTrail threats</span>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'rgba(2,6,20,0.78)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto', animation: 'slideIn 0.3s ease', position: 'relative', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#f0f9ff', fontSize: '14px', fontWeight: 700, margin: 0 }}>Incident Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>

              {/* Severity indicator */}
              {(() => {
                const s    = SEV[selected.severity] || SEV.LOW
                const stC  = ST_COLOR[selected.status] || '#6b7280'
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '13px', background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '12px', backdropFilter: 'blur(12px)' }}>
                      <p style={{ color: s.color, fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'monospace', textShadow: `0 0 16px ${s.color}77` }}>{selected.severity}</p>
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '9px', margin: '3px 0 0', letterSpacing: '0.08em' }}>SEVERITY</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '13px', background: `${stC}10`, border: `1px solid ${stC}28`, borderRadius: '12px', backdropFilter: 'blur(12px)' }}>
                      <p style={{ color: stC, fontSize: '12px', fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>{selected.status}</p>
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '9px', margin: '3px 0 0', letterSpacing: '0.08em' }}>STATUS</p>
                    </div>
                  </div>
                )
              })()}

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['Incident ID',  selected.incident_id],
                  ['Threat ID',    selected.threat_id],
                  ['Event Type',   selected.event_type],
                  ['Username',     selected.username || '—'],
                  ['Source IP',    selected.source_ip || '—'],
                  ['Region',       selected.region || '—'],
                  ['Assigned To',  selected.assigned_to || 'Unassigned'],
                  ['Risk Score',   selected.risk_score ? `${selected.risk_score}/100` : '—'],
                  ['MITRE',        selected.mitre || '—'],
                  ['Created',      new Date(selected.created_at).toLocaleString()],
                  ['Updated',      new Date(selected.updated_at).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(59,130,246,0.55)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', minWidth: '80px', flexShrink: 0 }}>{k}</span>
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selected.description && (
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '10px' }}>
                  <p style={{ color: '#60a5fa', fontSize: '9px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.1em' }}>DESCRIPTION</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{selected.description}</p>
                </div>
              )}

              {/* AI Analysis */}
              {selected.ai_analysis && (
                <div style={{ padding: '12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '10px' }}>
                  <p style={{ color: '#a78bfa', fontSize: '9px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.1em' }}>🤖 AI ANALYSIS</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{selected.ai_analysis}</p>
                </div>
              )}

              {/* Resolution notes */}
              {selected.resolution_notes && (
                <div style={{ padding: '12px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px' }}>
                  <p style={{ color: '#34d399', fontSize: '9px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.1em' }}>RESOLUTION NOTES</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{selected.resolution_notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selected.status !== 'RESOLVED' && (
                  <button onClick={() => setShowAssign(true)} style={{ padding: '10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                    👤 Assign Incident
                  </button>
                )}
                {selected.status !== 'RESOLVED' && (
                  <button onClick={() => setShowResolve(true)} style={{ padding: '10px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                    ✅ Resolve Incident
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssign && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'rgba(2,6,20,0.95)', backdropFilter: 'blur(32px)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', padding: '28px', width: '400px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#f0f9ff', fontSize: '16px', fontWeight: 700, margin: 0 }}>Assign Incident</h3>
              <button onClick={() => setShowAssign(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[{ label: 'Assign To', key: 'assignTo', val: assignTo, set: setAssignTo }, { label: 'Notes', key: 'notes', val: notes, set: setNotes }].map(({ label, key, val, set }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: 'rgba(59,130,246,0.6)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>{label.toUpperCase()}</label>
                  <input value={val} onChange={e => set(e.target.value)} required={key === 'assignTo'}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '9px', padding: '9px 13px', color: 'white', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAssign(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'rgba(2,6,20,0.95)', backdropFilter: 'blur(32px)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: '20px', padding: '28px', width: '400px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(52,211,153,0.5),transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#f0f9ff', fontSize: '16px', fontWeight: 700, margin: 0 }}>Resolve Incident</h3>
              <button onClick={() => setShowResolve(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: 'rgba(52,211,153,0.6)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>RESOLUTION NOTES</label>
                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} required rows={3}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '9px', padding: '9px 13px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowResolve(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>✅ Resolve</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}