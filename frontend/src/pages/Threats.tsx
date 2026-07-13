import { useEffect, useState, useRef } from 'react'
import { getThreats, updateThreatStatus, createThreat } from '../services/api'

interface Threat {
  threat_id: string
  event_type: string
  severity: string
  risk_score: number
  source_ip: string
  username: string
  timestamp: string
  status: string
  description: string
  region: string
  mitre?: string
  ai_analysis?: string
  raw_event_name?: string
}

const SEV: Record<string, { color: string; glow: string; bg: string }> = {
  CRITICAL: { color: '#f87171', glow: 'rgba(248,113,113,0.4)',  bg: 'rgba(248,113,113,0.08)'  },
  HIGH:     { color: '#fb923c', glow: 'rgba(251,146,60,0.4)',   bg: 'rgba(251,146,60,0.08)'   },
  MEDIUM:   { color: '#fbbf24', glow: 'rgba(251,191,36,0.4)',   bg: 'rgba(251,191,36,0.08)'   },
  LOW:      { color: '#34d399', glow: 'rgba(52,211,153,0.4)',   bg: 'rgba(52,211,153,0.08)'   },
}

// ── Circuit Board Canvas (Threats background) ─────────────
function CircuitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    window.addEventListener('resize', () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    })

    // Circuit grid nodes
    const COLS = 14, ROWS = 9
    const CW = W / COLS, CH = H / ROWS
    interface Node { x: number; y: number; active: boolean; pulse: number; timer: number }
    const nodes: Node[] = []
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        nodes.push({ x: c * CW, y: r * CH, active: false, pulse: 0, timer: Math.random() * 200 })
      }
    }

    // Circuit paths (horizontal + vertical traces)
    interface Trace {
      fromX: number; fromY: number; toX: number; toY: number
      progress: number; speed: number; active: boolean; timer: number
      color: string
    }
    const traces: Trace[] = []
    const COLS2 = COLS + 1
    const traceColors = ['#06b6d4', '#3b82f6', '#22d3ee', '#0ea5e9', '#38bdf8']

    for (let i = 0; i < 30; i++) {
      const isH  = Math.random() > 0.4
      const col  = Math.floor(Math.random() * COLS)
      const row  = Math.floor(Math.random() * ROWS)
      const x1   = col * CW,           y1 = row * CH
      const x2   = isH ? x1 + CW : x1, y2 = isH ? y1 : y1 + CH
      traces.push({
        fromX: x1, fromY: y1, toX: x2, toY: y2,
        progress: Math.random(),
        speed:    Math.random() * 0.006 + 0.003,
        active:   true,
        timer:    Math.floor(Math.random() * 120),
        color:    traceColors[Math.floor(Math.random() * traceColors.length)],
      })
    }

    // Data packets traveling along traces
    interface Packet { x: number; y: number; tx: number; ty: number; progress: number; speed: number; color: string }
    const packets: Packet[] = []
    const spawnPacket = () => {
      const col  = Math.floor(Math.random() * COLS)
      const row  = Math.floor(Math.random() * ROWS)
      const isH  = Math.random() > 0.4
      const x1   = col * CW, y1 = row * CH
      packets.push({
        x: x1, y: y1,
        tx: isH ? x1 + CW : x1,
        ty: isH ? y1 : y1 + CH,
        progress: 0,
        speed: Math.random() * 0.015 + 0.008,
        color: traceColors[Math.floor(Math.random() * traceColors.length)],
      })
    }
    for (let i = 0; i < 12; i++) spawnPacket()

    let tick = 0
    const draw = () => {
      tick++
      ctx.clearRect(0, 0, W, H)

      // Background
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0,   '#020814')
      bg.addColorStop(0.5, '#040d1a')
      bg.addColorStop(1,   '#020814')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Grid base lines (dim)
      ctx.globalAlpha = 0.06
      ctx.strokeStyle = '#0891b2'
      ctx.lineWidth   = 0.5
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * CW, 0); ctx.lineTo(c * CW, H); ctx.stroke()
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * CH); ctx.lineTo(W, r * CH); ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Active traces with glow
      traces.forEach(t => {
        t.timer--
        if (t.timer <= 0) {
          t.timer    = Math.floor(Math.random() * 200 + 60)
          t.active   = Math.random() > 0.3
          t.progress = 0
        }
        if (!t.active) return
        t.progress = Math.min(t.progress + t.speed, 1)
        const cx   = t.fromX + (t.toX - t.fromX) * t.progress
        const cy   = t.fromY + (t.toY - t.fromY) * t.progress

        // Glow trace
        ctx.shadowBlur  = 8
        ctx.shadowColor = t.color
        ctx.strokeStyle = t.color
        ctx.lineWidth   = 1.2
        ctx.globalAlpha = 0.5
        ctx.beginPath(); ctx.moveTo(t.fromX, t.fromY); ctx.lineTo(cx, cy); ctx.stroke()
        ctx.shadowBlur  = 0
        ctx.globalAlpha = 1
      })

      // Circuit nodes (pads)
      nodes.forEach(n => {
        n.timer--
        if (n.timer <= 0) {
          n.timer  = Math.floor(Math.random() * 300 + 60)
          n.active = Math.random() > 0.6
          n.pulse  = 0
        }
        if (n.active) n.pulse = Math.min(n.pulse + 0.04, 1)

        const alpha  = n.active ? 0.5 + n.pulse * 0.4 : 0.12
        const radius = n.active ? 3 + n.pulse * 2 : 2

        // Pad glow
        if (n.active) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 4)
          g.addColorStop(0, `rgba(6,182,212,${n.pulse * 0.35})`)
          g.addColorStop(1, 'rgba(6,182,212,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(n.x, n.y, radius * 4, 0, Math.PI * 2); ctx.fill()
        }

        ctx.globalAlpha  = alpha
        ctx.fillStyle    = n.active ? '#06b6d4' : '#164e63'
        ctx.strokeStyle  = n.active ? '#22d3ee' : '#155e75'
        ctx.lineWidth    = 0.5
        ctx.beginPath(); ctx.arc(n.x, n.y, radius, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.globalAlpha = 1
      })

      // Data packets (bright moving dots)
      packets.forEach((p, idx) => {
        p.progress += p.speed
        p.x = p.x + (p.tx - p.x) * (p.speed * 0.8) // lerp toward target  isn't exact but looks smooth
        p.y = p.y + (p.ty - p.y) * (p.speed * 0.8)

        const dist = Math.hypot(p.tx - p.x, p.ty - p.y)

        // Glow trail
        const trail = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10)
        trail.addColorStop(0, p.color + 'cc')
        trail.addColorStop(1, p.color + '00')
        ctx.fillStyle = trail
        ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill()

        // Core
        ctx.fillStyle    = '#ffffff'
        ctx.globalAlpha  = 0.9
        ctx.shadowBlur   = 6
        ctx.shadowColor  = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur   = 0
        ctx.globalAlpha  = 1

        if (dist < 4 || p.progress > 1) {
          packets.splice(idx, 1); spawnPacket()
        }
      })

      // Binary rain (subtle)
      if (tick % 8 === 0) {
        ctx.font         = '9px monospace'
        ctx.globalAlpha  = 0.06
        ctx.fillStyle    = '#06b6d4'
        for (let i = 0; i < 5; i++) {
          const bx = Math.random() * W
          const by = Math.random() * H
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', bx, by)
        }
        ctx.globalAlpha  = 1
      }

      // Top scan line
      const scanY = ((tick * 0.5) % (H + 40)) - 20
      const sl    = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      sl.addColorStop(0,   'rgba(6,182,212,0)')
      sl.addColorStop(0.5, 'rgba(6,182,212,0.04)')
      sl.addColorStop(1,   'rgba(6,182,212,0)')
      ctx.fillStyle = sl; ctx.fillRect(0, scanY - 20, W, 40)

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
    <div style={{
      position:             'relative',
      background:           `${color}08`,
      backdropFilter:       'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border:               `1px solid ${color}28`,
      borderRadius:         '18px',
      padding:              '20px 18px',
      overflow:             'hidden',
      animation:            `fadeUp 0.5s ease ${delay}s both`,
      boxShadow:            `inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)`,
      transition:           'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${color}22` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';    (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)` }}
    >
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
      <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', background: `radial-gradient(circle,${color}25,transparent 70%)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', margin: 0 }}>{label.toUpperCase()}</p>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <p style={{ color, fontSize: '36px', fontWeight: 800, margin: 0, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 20px ${color}77` }}>{value}</p>
      <div style={{ marginTop: '10px', height: '2px', background: `linear-gradient(90deg,${color},transparent)`, borderRadius: '999px', opacity: 0.5 }} />
    </div>
  )
}

export default function Threats() {
  const [threats,    setThreats]    = useState<Threat[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filterSev,  setFilterSev]  = useState('')
  const [filterSt,   setFilterSt]   = useState('')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState<Threat | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState({ event_type:'', source_ip:'', username:'', description:'', region:'ap-south-2' })

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getThreats({ limit: 200 })
      setThreats(res.data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = threats.filter(t => {
    const mSev    = !filterSev || t.severity === filterSev
    const mSt     = !filterSt  || t.status   === filterSt
    const mSearch = !search    || [t.event_type, t.username, t.source_ip, t.threat_id, t.description].join(' ').toLowerCase().includes(search.toLowerCase())
    return mSev && mSt && mSearch
  })

  const counts = {
    total:    threats.length,
    critical: threats.filter(t => t.severity === 'CRITICAL').length,
    high:     threats.filter(t => t.severity === 'HIGH').length,
    open:     threats.filter(t => t.status   === 'OPEN').length,
    resolved: threats.filter(t => t.status   === 'RESOLVED').length,
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await createThreat(form); await fetch(); setShowCreate(false) } catch (err) { console.error(err) }
  }

  const handleStatus = async (id: string, status: string) => {
    try { await updateThreatStatus(id, status); await fetch() } catch (err) { console.error(err) }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .trow:hover { background: rgba(6,182,212,0.04) !important; cursor:pointer; }
        .sev-btn:hover { opacity:0.85; }
      `}</style>

      <CircuitCanvas />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Header */}
        <div style={{ background: 'rgba(2,8,20,0.7)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '18px', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.6),transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '12px', animation: 'pulse 2.5s infinite' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#06b6d4" strokeWidth="1.5" fill="rgba(6,182,212,0.1)"/>
                <line x1="12" y1="9"  x2="12" y2="13" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="1" fill="#06b6d4"/>
              </svg>
            </div>
            <div>
              <h1 style={{ color: '#f0f9ff', fontSize: '17px', fontWeight: 700, margin: 0 }}>Threat Detection</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0', letterSpacing: '0.08em' }}>
                REAL-TIME CLOUDTRAIL INTELLIGENCE · {filtered.length} EVENTS
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetch} style={{ padding: '8px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)', borderRadius: '10px', color: '#06b6d4', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>↻ REFRESH</button>
            <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: '10px', color: '#22d3ee', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>+ CREATE THREAT</button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          <GlassCard label="Total Threats"  value={counts.total}    color="#06b6d4" icon="⚡" delay={0}    />
          <GlassCard label="Critical"       value={counts.critical} color="#f87171" icon="🚨" delay={0.06} />
          <GlassCard label="High"           value={counts.high}     color="#fb923c" icon="⚠️" delay={0.12} />
          <GlassCard label="Open"           value={counts.open}     color="#fbbf24" icon="🔓" delay={0.18} />
          <GlassCard label="Resolved"       value={counts.resolved} color="#34d399" icon="✅" delay={0.24} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(2,8,20,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: '14px', padding: '14px 18px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search threats, users, IPs..."
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px', outline: 'none', width: '240px' }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['','CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
              <button key={s} onClick={() => setFilterSev(s)}
                style={{ padding: '7px 13px', borderRadius: '9px', border: `1px solid ${filterSev === s ? (SEV[s]?.color || '#06b6d4') : 'rgba(255,255,255,0.08)'}`, background: filterSev === s ? `${SEV[s]?.bg || 'rgba(6,182,212,0.1)'}` : 'rgba(255,255,255,0.03)', color: filterSev === s ? (SEV[s]?.color || '#06b6d4') : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', backdropFilter: 'blur(8px)' }}>
                {s || 'ALL SEV'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['','OPEN','RESOLVED','DISMISSED'].map(s => (
              <button key={s} onClick={() => setFilterSt(s)}
                style={{ padding: '7px 13px', borderRadius: '9px', border: `1px solid ${filterSt === s ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)'}`, background: filterSt === s ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)', color: filterSt === s ? '#06b6d4' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', backdropFilter: 'blur(8px)' }}>
                {s || 'ALL STATUS'}
              </button>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', alignSelf: 'center', marginLeft: 'auto' }}>
            Showing {filtered.length} / {threats.length}
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: '16px' }}>

          {/* Table */}
          <div style={{ background: 'rgba(2,8,20,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(6,182,212,0.14)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeUp 0.4s ease 0.28s both', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.5),transparent)' }} />
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(6,182,212,0.2)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ color: 'rgba(6,182,212,0.6)', fontSize: '13px', letterSpacing: '0.12em' }}>LOADING THREATS...</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(6,182,212,0.12)', background: 'rgba(6,182,212,0.03)' }}>
                    {['THREAT ID','EVENT TYPE','SEVERITY','RISK','USER','SOURCE IP','REGION','TIME','STATUS','ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: 'rgba(6,182,212,0.6)', letterSpacing: '0.1em', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 60).map((t, i) => {
                    const s     = SEV[t.severity] || SEV.LOW
                    const isAct = selected?.threat_id === t.threat_id
                    return (
                      <tr key={t.threat_id} className="trow"
                        onClick={() => setSelected(isAct ? null : t)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isAct ? 'rgba(6,182,212,0.07)' : 'transparent', transition: 'background 0.15s', animation: `fadeUp 0.25s ease ${Math.min(i,20)*0.02}s both` }}>
                        <td style={{ padding: '11px 12px', color: '#22d3ee', fontSize: '10px', fontFamily: 'monospace', fontWeight: 600 }}>{t.threat_id}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.75)', fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.event_type}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', background: s.bg, color: s.color, border: `1px solid ${s.color}30`, backdropFilter: 'blur(6px)', boxShadow: `0 0 8px ${s.color}22` }}>{t.severity}</span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '3px', width: `${t.risk_score}%`, background: `linear-gradient(90deg,${s.color},${s.color}66)`, borderRadius: '999px' }} />
                            </div>
                            <span style={{ color: s.color, fontSize: '11px', fontFamily: 'monospace', fontWeight: 700 }}>{t.risk_score}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontFamily: 'monospace' }}>{t.username}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'monospace' }}>{t.source_ip}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{t.region}</td>
                        <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, color: t.status === 'OPEN' ? '#f87171' : t.status === 'RESOLVED' ? '#34d399' : '#94a3b8', background: t.status === 'OPEN' ? 'rgba(248,113,113,0.1)' : t.status === 'RESOLVED' ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.1)', backdropFilter: 'blur(6px)' }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                            {t.status !== 'RESOLVED' && (
                              <button onClick={() => handleStatus(t.threat_id, 'RESOLVED')} style={{ padding: '3px 8px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>✓</button>
                            )}
                            {t.status !== 'DISMISSED' && (
                              <button onClick={() => handleStatus(t.threat_id, 'DISMISSED')} style={{ padding: '3px 8px', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'rgba(6,182,212,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>NO THREATS FOUND · PIPELINE ACTIVE</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'rgba(2,8,20,0.75)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto', animation: 'slideIn 0.3s ease', position: 'relative', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.6),transparent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#f0f9ff', fontSize: '14px', fontWeight: 700, margin: 0 }}>Threat Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>

              {/* Severity badge */}
              {(() => {
                const s = SEV[selected.severity] || SEV.LOW
                return (
                  <div style={{ textAlign: 'center', padding: '16px', background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '14px', backdropFilter: 'blur(12px)' }}>
                    <p style={{ color: s.color, fontSize: '22px', fontWeight: 800, margin: 0, fontFamily: 'monospace', textShadow: `0 0 24px ${s.color}77` }}>{selected.severity}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '4px 0 0' }}>Risk Score: {selected.risk_score}/100</p>
                    <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '4px', width: `${selected.risk_score}%`, background: `linear-gradient(90deg,${s.color},${s.color}66)`, borderRadius: '999px', boxShadow: `0 0 8px ${s.color}55` }} />
                    </div>
                  </div>
                )
              })()}

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['Threat ID',  selected.threat_id],
                  ['Event',      selected.raw_event_name || selected.event_type],
                  ['Event Type', selected.event_type],
                  ['Username',   selected.username],
                  ['Source IP',  selected.source_ip],
                  ['Region',     selected.region],
                  ['Time',       new Date(selected.timestamp).toLocaleString()],
                  ['Status',     selected.status],
                  ['MITRE',      selected.mitre || 'N/A'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(6,182,212,0.5)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', minWidth: '70px' }}>{k}</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selected.description && (
                <div style={{ padding: '12px', background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: '10px' }}>
                  <p style={{ color: '#22d3ee', fontSize: '9px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.1em' }}>DESCRIPTION</p>
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
            </div>
          )}
        </div>
      </div>

      {/* Create Threat Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'rgba(2,8,20,0.95)', backdropFilter: 'blur(32px)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '20px', padding: '28px', width: '440px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.6),transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
              <h3 style={{ color: '#f0f9ff', fontSize: '16px', fontWeight: 700, margin: 0 }}>Create Manual Threat</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Event Type',   key: 'event_type' },
                { label: 'Source IP',    key: 'source_ip' },
                { label: 'Username',     key: 'username' },
                { label: 'Description', key: 'description' },
                { label: 'Region',      key: 'region' },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: 'rgba(6,182,212,0.6)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>{label.toUpperCase()}</label>
                  <input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: '9px', padding: '9px 13px', color: 'white', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: '10px', color: '#22d3ee', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Create Threat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}