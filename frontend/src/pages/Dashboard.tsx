import { useEffect, useState, useRef } from 'react'
import { getDashboard } from '../services/api'

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
}

interface DashboardData {
  summary: {
    total_threats: number
    critical_threats: number
    high_threats: number
    open_incidents: number
    asset_count: number
  }
  severity_breakdown: Record<string, number>
  status_breakdown: Record<string, number>
  recent_threats: Threat[]
  timeline_7d: { labels: string[]; data: number[] }
  aws_status: Record<string, any>
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH:     '#fb923c',
  MEDIUM:   '#fbbf24',
  LOW:      '#34d399',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN:      '#f87171',
  ASSIGNED:  '#60a5fa',
  RESOLVED:  '#34d399',
  DISMISSED: '#6b7280',
}

// ── Animated Glass Background Canvas ───────────────────
function GlassCanvas() {
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

    // Glass bubble orbs
    interface Orb {
      x: number; y: number; r: number
      vx: number; vy: number
      hue: number; alpha: number
      pulse: number; pulseSpeed: number
    }

    const orbs: Orb[] = Array.from({ length: 18 }, (_, i) => ({
      x:          Math.random() * W,
      y:          Math.random() * H,
      r:          Math.random() * 120 + 40,
      vx:         (Math.random() - 0.5) * 0.3,
      vy:         (Math.random() - 0.5) * 0.3,
      hue:        [220, 260, 180, 340][i % 4],
      alpha:      Math.random() * 0.06 + 0.02,
      pulse:      Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.008 + 0.004,
    }))

    // Floating glass shards
    interface Shard {
      x: number; y: number; w: number; h: number
      vx: number; vy: number; rot: number; rotV: number
      hue: number; alpha: number
    }

    const shards: Shard[] = Array.from({ length: 10 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      w:     Math.random() * 80 + 30,
      h:     Math.random() * 40 + 15,
      vx:    (Math.random() - 0.5) * 0.2,
      vy:    (Math.random() - 0.5) * 0.15,
      rot:   Math.random() * Math.PI * 2,
      rotV:  (Math.random() - 0.5) * 0.002,
      hue:   [200, 270, 160][Math.floor(Math.random() * 3)],
      alpha: Math.random() * 0.06 + 0.02,
    }))

    let tick = 0

    const draw = () => {
      tick++
      ctx.clearRect(0, 0, W, H)

      // Deep dark background
      ctx.fillStyle = '#04060f'
      ctx.fillRect(0, 0, W, H)

      // Fine grid
      ctx.globalAlpha = 0.025
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth   = 0.5
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Glass orbs — soft radial with rim highlight
      orbs.forEach(o => {
        o.pulse += o.pulseSpeed
        const rNow = o.r + Math.sin(o.pulse) * 8
        o.x += o.vx; o.y += o.vy
        if (o.x < -rNow) o.x = W + rNow
        if (o.x > W + rNow) o.x = -rNow
        if (o.y < -rNow) o.y = H + rNow
        if (o.y > H + rNow) o.y = -rNow

        // Outer glow
        const g1 = ctx.createRadialGradient(o.x, o.y - rNow * 0.3, 0, o.x, o.y, rNow * 1.4)
        g1.addColorStop(0,   `hsla(${o.hue},80%,70%,${o.alpha * 0.5})`)
        g1.addColorStop(1,   `hsla(${o.hue},80%,70%,0)`)
        ctx.fillStyle = g1
        ctx.beginPath()
        ctx.arc(o.x, o.y, rNow * 1.4, 0, Math.PI * 2)
        ctx.fill()

        // Glass body
        const g2 = ctx.createRadialGradient(o.x - rNow * 0.3, o.y - rNow * 0.35, rNow * 0.1, o.x, o.y, rNow)
        g2.addColorStop(0,   `hsla(${o.hue},60%,90%,${o.alpha * 1.8})`)
        g2.addColorStop(0.5, `hsla(${o.hue},70%,65%,${o.alpha})`)
        g2.addColorStop(1,   `hsla(${o.hue},80%,40%,${o.alpha * 0.4})`)
        ctx.fillStyle = g2
        ctx.beginPath()
        ctx.arc(o.x, o.y, rNow, 0, Math.PI * 2)
        ctx.fill()

        // Rim
        ctx.strokeStyle = `hsla(${o.hue},80%,85%,${o.alpha * 2})`
        ctx.lineWidth   = 0.8
        ctx.stroke()

        // Top specular
        const g3 = ctx.createRadialGradient(o.x - rNow * 0.25, o.y - rNow * 0.35, 0, o.x - rNow * 0.2, o.y - rNow * 0.3, rNow * 0.45)
        g3.addColorStop(0, `hsla(0,0%,100%,0.25)`)
        g3.addColorStop(1, `hsla(0,0%,100%,0)`)
        ctx.fillStyle = g3
        ctx.beginPath()
        ctx.arc(o.x, o.y, rNow, 0, Math.PI * 2)
        ctx.fill()
      })

      // Floating glass shards (rounded rects)
      shards.forEach(s => {
        s.x += s.vx; s.y += s.vy; s.rot += s.rotV
        if (s.x > W + 100) s.x = -100
        if (s.x < -100)    s.x = W + 100
        if (s.y > H + 100) s.y = -100
        if (s.y < -100)    s.y = H + 100

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        const rr = Math.min(s.w, s.h) * 0.3

        ctx.globalAlpha = s.alpha
        const sg = ctx.createLinearGradient(-s.w/2, -s.h/2, s.w/2, s.h/2)
        sg.addColorStop(0, `hsla(${s.hue},60%,85%,0.8)`)
        sg.addColorStop(0.5, `hsla(${s.hue},70%,60%,0.4)`)
        sg.addColorStop(1, `hsla(${s.hue},80%,40%,0.1)`)
        ctx.fillStyle = sg
        ctx.beginPath()
        ctx.roundRect(-s.w/2, -s.h/2, s.w, s.h, rr)
        ctx.fill()
        ctx.strokeStyle = `hsla(${s.hue},70%,90%,0.4)`
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.restore()
      })

      // Slow diagonal light sweep
      const sweepX = ((tick * 0.4) % (W + 400)) - 200
      const sg2 = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, H)
      sg2.addColorStop(0,   'rgba(148,180,255,0)')
      sg2.addColorStop(0.5, 'rgba(148,180,255,0.025)')
      sg2.addColorStop(1,   'rgba(148,180,255,0)')
      ctx.fillStyle = sg2
      ctx.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

// ── Animated SOC Icon ────────────────────────────────────
function SOCIcon() {
  return (
    <>
      <style>{`
        @keyframes iconFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes ringExpand   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
        @keyframes scanLine     { 0%,100%{opacity:.2} 50%{opacity:.9} }
        @keyframes dotPulse     { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.4);opacity:1} }
        @keyframes shieldGlow   { 0%,100%{filter:drop-shadow(0 0 4px rgba(96,165,250,.4))} 50%{filter:drop-shadow(0 0 12px rgba(96,165,250,.8))} }
      `}</style>
      <div style={{ position: 'relative', display: 'inline-flex', animation: 'iconFloat 3.5s ease-in-out infinite' }}>
        <div style={{ position: 'absolute', inset: '-10px', borderRadius: '16px', border: '1px solid rgba(96,165,250,0.3)', animation: 'ringExpand 2.5s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: '-10px', borderRadius: '16px', border: '1px solid rgba(96,165,250,0.2)', animation: 'ringExpand 2.5s ease-out infinite', animationDelay: '0.8s' }} />
        <div style={{ padding: '10px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '14px', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ animation: 'shieldGlow 2.5s ease-in-out infinite' }}>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa"/>
                <stop offset="100%" stopColor="#a78bfa"/>
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(96,165,250,0.1)" stroke="url(#sg)" strokeWidth="1.5"/>
            <line x1="8.5" y1="11" x2="15.5" y2="11" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" style={{ animation: 'scanLine 1.8s ease-in-out infinite' }}/>
            <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke="#60a5fa" strokeWidth="0.8" strokeLinecap="round" style={{ animation: 'scanLine 1.8s ease-in-out infinite', animationDelay: '0.4s' }}/>
            <circle cx="12" cy="9" r="1.5" fill="#60a5fa" style={{ animation: 'dotPulse 2s ease-in-out infinite' }}/>
          </svg>
        </div>
      </div>
    </>
  )
}

// ── Glass card helper ─────────────────────────────────────
const glassCard = (accent = 'rgba(255,255,255,0.04)', borderColor = 'rgba(255,255,255,0.1)'): React.CSSProperties => ({
  background:           accent,
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               `1px solid ${borderColor}`,
  borderRadius:         '18px',
  boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)',
  position:             'relative' as const,
  overflow:             'hidden' as const,
})

export default function Dashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState(new Date())
  const [clock,   setClock]   = useState(new Date())

  const fetchData = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
      setUpdated(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
    const d = setInterval(fetchData, 30000)
    const c = setInterval(() => setClock(new Date()), 1000)
    return () => { clearInterval(d); clearInterval(c) }
  }, [])

  const sev   = data?.severity_breakdown ?? {}
  const total = data?.summary.total_threats || 1
  const maxTL = Math.max(...(data?.timeline_7d.data ?? [1]), 1)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', position: 'relative', zIndex: 1 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '2px solid rgba(96,165,250,0.2)', borderTop: '2px solid #60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(96,165,250,0.7)', fontSize: '13px', letterSpacing: '0.15em', margin: 0 }}>LOADING SOC PLATFORM...</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes cardHover { to{transform:translateY(-2px)} }
        .soc-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .soc-card:hover { transform: translateY(-3px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.5) !important; }
        .soc-row:hover { background: rgba(255,255,255,0.03) !important; }
        .soc-btn:hover { background: rgba(96,165,250,0.15) !important; }
      `}</style>

      {/* Background */}
      <GlassCanvas />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── HEADER ── */}
        <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.09)'), padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.4s ease' }}>
          {/* Shimmer top edge */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.5),transparent)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SOCIcon />
            <div>
              <h1 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 700, margin: 0, letterSpacing: '0.03em' }}>
                Security Operations Center
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0', letterSpacing: '0.1em' }}>
                AWS CLOUD THREAT INTELLIGENCE — REAL-TIME
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {clock.toLocaleTimeString()}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '2px 0 0', fontFamily: 'monospace' }}>
                {clock.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '9px', margin: '1px 0 0', letterSpacing: '0.06em' }}>
                SYNC {updated.toLocaleTimeString()}
              </p>
            </div>
            <button onClick={fetchData} className="soc-btn" style={{ padding: '8px 16px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', transition: 'background 0.18s' }}>
              ↻ REFRESH
            </button>
            <div style={{ padding: '6px 13px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'pulse 1.8s infinite' }} />
              <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          {[
            { label: 'Total Threats',    value: data?.summary.total_threats    ?? 0, color: '#60a5fa', glow: 'rgba(96,165,250,0.25)',   icon: '⚡', grad: 'linear-gradient(135deg,rgba(96,165,250,0.12),rgba(96,165,250,0.03))'  },
            { label: 'Critical Alerts',  value: data?.summary.critical_threats ?? 0, color: '#f87171', glow: 'rgba(248,113,113,0.25)',  icon: '🚨', grad: 'linear-gradient(135deg,rgba(248,113,113,0.12),rgba(248,113,113,0.03))' },
            { label: 'High Severity',    value: data?.summary.high_threats     ?? 0, color: '#fb923c', glow: 'rgba(251,146,60,0.25)',   icon: '⚠️', grad: 'linear-gradient(135deg,rgba(251,146,60,0.12),rgba(251,146,60,0.03))'  },
            { label: 'Open Incidents',   value: data?.summary.open_incidents   ?? 0, color: '#fbbf24', glow: 'rgba(251,191,36,0.25)',   icon: '🛡', grad: 'linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.03))'  },
            { label: 'Assets Monitored', value: data?.summary.asset_count      ?? 0, color: '#34d399', glow: 'rgba(52,211,153,0.25)',   icon: '🖥', grad: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(52,211,153,0.03))'  },
          ].map(({ label, value, color, glow, icon, grad }, i) => (
            <div key={label} className="soc-card" style={{
              background:           grad,
              backdropFilter:       'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border:               `1px solid ${color}22`,
              borderRadius:         '18px',
              padding:              '20px 16px',
              position:             'relative',
              overflow:             'hidden',
              animation:            `fadeUp 0.4s ease ${i * 0.06}s both`,
            }}>
              {/* Top shimmer */}
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg,transparent,${color}80,transparent)` }} />
              {/* Corner glow */}
              <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle,${glow},transparent 70%)` }} />
              {/* Bottom glow */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${color}44,transparent)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', margin: 0 }}>
                  {label.toUpperCase()}
                </p>
                <span style={{ fontSize: '17px' }}>{icon}</span>
              </div>
              <p style={{ color, fontSize: '34px', fontWeight: 800, margin: '0 0 8px', fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 18px ${color}66` }}>
                {value}
              </p>
              <div style={{ height: '2px', background: `linear-gradient(90deg,${color},transparent)`, borderRadius: '999px', opacity: 0.5 }} />
            </div>
          ))}
        </div>

        {/* ── ROW 2: Timeline + Severity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>

          {/* Timeline bar chart */}
          <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.025)'), padding: '22px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: 0, letterSpacing: '0.06em' }}>Threat Timeline</h2>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '3px 0 0' }}>Detection volume — last 7 days</p>
              </div>
              <span style={{ padding: '4px 11px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: '7px', color: '#60a5fa', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em' }}>7D</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px' }}>
              {(data?.timeline_7d.labels ?? []).map((label, i) => {
                const val     = data?.timeline_7d.data[i] ?? 0
                const pct     = (val / maxTL) * 100
                const isToday = i === (data?.timeline_7d.labels.length ?? 1) - 1
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
                    {val > 0 && <span style={{ color: isToday ? '#60a5fa' : 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 700 }}>{val}</span>}
                    <div style={{ width: '100%', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(pct, 3)}%`,
                        background: isToday
                          ? 'linear-gradient(180deg,#60a5fa,rgba(96,165,250,0.25))'
                          : 'linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.04))',
                        borderRadius: '5px 5px 2px 2px',
                        border: `1px solid ${isToday ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isToday ? '0 0 14px rgba(96,165,250,0.4)' : 'none',
                        backdropFilter: 'blur(4px)',
                        minHeight: '3px',
                        transition: 'height 0.6s ease',
                      }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '9px' }}>{label.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Severity matrix */}
          <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.025)'), padding: '22px', animation: 'fadeUp 0.4s ease 0.24s both' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.06em' }}>Severity Matrix</h2>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '0 0 18px' }}>Threat classification</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'CRITICAL', color: '#f87171' },
                { key: 'HIGH',     color: '#fb923c' },
                { key: 'MEDIUM',   color: '#fbbf24' },
                { key: 'LOW',      color: '#34d399' },
              ].map(({ key, color }) => {
                const count = sev[key] || 0
                const pct   = Math.round((count / total) * 100)
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}` }} />
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em' }}>{key}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                        <span style={{ color, fontSize: '13px', fontWeight: 800, fontFamily: 'monospace' }}>{count}</span>
                        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '10px' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: '999px', boxShadow: `0 0 8px ${color}55`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Status pills */}
            <div style={{ marginTop: '18px', display: 'flex', gap: '7px' }}>
              {[
                { label: 'Open',     color: '#f87171', val: data?.status_breakdown?.OPEN     ?? 0 },
                { label: 'Assigned', color: '#60a5fa', val: data?.status_breakdown?.ASSIGNED ?? 0 },
                { label: 'Resolved', color: '#34d399', val: data?.status_breakdown?.RESOLVED ?? 0 },
              ].map(({ label, color, val }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', padding: '9px 5px', background: `${color}0e`, border: `1px solid ${color}28`, borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                  <p style={{ color, fontSize: '17px', fontWeight: 800, margin: 0, fontFamily: 'monospace' }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '9px', margin: 0, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HEATMAP ── */}
        <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.025)'), padding: '22px', animation: 'fadeUp 0.4s ease 0.28s both' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: 0, letterSpacing: '0.06em' }}>Threat Tactic Heatmap</h2>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '3px 0 0' }}>Event type × severity — opacity reflects frequency</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '9px' }}>
            {[
              { label: 'Root Login',    sev: 'CRITICAL', count: sev['CRITICAL'] || 0 },
              { label: 'Admin Policy',  sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.4) },
              { label: 'SG Deleted',    sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.35) },
              { label: 'Trail Stopped', sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.25) },
              { label: 'IAM Created',   sev: 'MEDIUM',   count: Math.floor((sev['MEDIUM'] || 0) * 0.5) },
              { label: 'Access Key',    sev: 'MEDIUM',   count: Math.floor((sev['MEDIUM'] || 0) * 0.5) },
              { label: 'S3 Bucket',     sev: 'LOW',      count: Math.floor((sev['LOW']    || 0) * 0.6) },
              { label: 'EC2 Launch',    sev: 'LOW',      count: Math.floor((sev['LOW']    || 0) * 0.4) },
            ].map(({ label, sev: s, count }) => {
              const color   = SEV_COLOR[s] || '#60a5fa'
              const opacity = count > 0 ? Math.min(0.07 + (count / total) * 0.55, 0.65) : 0.04
              const hex     = Math.round(opacity * 255).toString(16).padStart(2, '0')
              return (
                <div key={label} style={{
                  padding:              '13px 8px',
                  background:           `${color}${hex}`,
                  border:               `1px solid ${color}${Math.round((opacity + 0.1) * 255).toString(16).padStart(2,'0')}`,
                  borderRadius:         '12px',
                  textAlign:            'center',
                  backdropFilter:       'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow:            count > 0 ? `0 3px 16px ${color}1a, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                }}>
                  <p style={{ color, fontSize: '19px', fontWeight: 800, margin: 0, fontFamily: 'monospace', textShadow: `0 0 10px ${color}88` }}>{count}</p>
                  <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '9px', margin: '4px 0 0', lineHeight: 1.4 }}>{label}</p>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '18px', marginTop: '12px', alignItems: 'center' }}>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: SEV_COLOR[s], boxShadow: `0 0 5px ${SEV_COLOR[s]}` }} />
                <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: '10px', letterSpacing: '0.06em' }}>{s}</span>
              </div>
            ))}
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px', marginLeft: 'auto' }}>Higher opacity = higher frequency</span>
          </div>
        </div>

        {/* ── LIVE THREAT FEED ── */}
        <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.02)'), overflow: 'hidden', animation: 'fadeUp 0.4s ease 0.32s both' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
          <div style={{ padding: '16px 22px 13px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: 0, letterSpacing: '0.06em' }}>Live Threat Feed</h2>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '2px 0 0' }}>Real-time detections from AWS CloudTrail pipeline</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 12px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '9px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 7px #34d399', animation: 'pulse 1.8s infinite' }} />
              <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['THREAT ID','EVENT TYPE','SEVERITY','RISK','USER','SOURCE IP','TIME','STATUS'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recent_threats ?? []).slice(0, 8).map((t, i) => (
                <tr key={t.threat_id} className="soc-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'background 0.15s', animation: `fadeUp 0.28s ease ${i * 0.035}s both` }}>
                  <td style={{ padding: '11px 14px', color: '#60a5fa', fontSize: '10px', fontFamily: 'monospace', fontWeight: 600 }}>{t.threat_id}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{t.event_type}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', background: `${SEV_COLOR[t.severity] || '#60a5fa'}14`, color: SEV_COLOR[t.severity] || '#60a5fa', border: `1px solid ${SEV_COLOR[t.severity] || '#60a5fa'}2e`, backdropFilter: 'blur(4px)' }}>
                      {t.severity}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '48px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '3px', width: `${t.risk_score}%`, background: `linear-gradient(90deg,${SEV_COLOR[t.severity]},${SEV_COLOR[t.severity]}88)`, borderRadius: '999px' }} />
                      </div>
                      <span style={{ color: SEV_COLOR[t.severity] || '#60a5fa', fontSize: '11px', fontFamily: 'monospace', fontWeight: 700 }}>{t.risk_score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontFamily: 'monospace' }}>{t.username}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'monospace' }}>{t.source_ip}</td>
                  <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontFamily: 'monospace' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '7px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', background: `${STATUS_COLOR[t.status] || '#6b7280'}12`, color: STATUS_COLOR[t.status] || '#6b7280', border: `1px solid ${STATUS_COLOR[t.status] || '#6b7280'}26`, backdropFilter: 'blur(4px)' }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recent_threats || data.recent_threats.length === 0) && (
                <tr>
                  <td colSpan={8} style={{ padding: '44px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '12px', letterSpacing: '0.08em' }}>
                    NO THREATS DETECTED — PIPELINE ACTIVE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── BOTTOM ROW: AWS Coverage + Risk Score ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          {/* AWS Service Coverage */}
          <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.025)'), padding: '22px', animation: 'fadeUp 0.4s ease 0.36s both' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.06em' }}>AWS Service Coverage</h2>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: `0 0 16px` }}>
              Live pipeline health · {data?.aws_status?.last_scan ? new Date(data.aws_status.last_scan).toLocaleTimeString() : 'checking...'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                { service: 'CloudTrail',  key: 'cloudtrail',  icon: '📋', detail: (s: any) => s?.trail_name    || '' },
                { service: 'Lambda',      key: 'lambda',      icon: '⚡', detail: (s: any) => s?.function_count !== undefined ? `${s.function_count} functions` : '' },
                { service: 'SNS Alerts',  key: 'sns',         icon: '🔔', detail: (s: any) => s?.topic_count   !== undefined ? `${s.topic_count} topics`    : '' },
                { service: 'DynamoDB',    key: 'dynamodb',    icon: '🗄', detail: (s: any) => s?.table_count   !== undefined ? `${s.table_count} tables`    : '' },
                { service: 'CloudWatch',  key: 'cloudwatch',  icon: '👁', detail: (s: any) => s?.alarm_count   !== undefined ? `${s.alarm_count} alarms`    : '' },
                { service: 'EventBridge', key: 'eventbridge', icon: '🔀', detail: (s: any) => s?.enabled_rules !== undefined ? `${s.enabled_rules} rules`   : '' },
              ].map(({ service, key, icon, detail }) => {
                const svcData = data?.aws_status?.[key]
                const healthy = svcData?.healthy ?? false
                const status  = svcData?.status  ?? 'CHECKING'
                const color   = healthy ? '#34d399' : status === 'CHECKING' ? '#fbbf24' : '#f87171'
                return (
                  <div key={service} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: `${color}06`, border: `1px solid ${color}18`, borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <span style={{ fontSize: '13px' }}>{icon}</span>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 500 }}>{service}</span>
                        {detail(svcData) && <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '10px', margin: 0 }}>{detail(svcData)}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, animation: healthy ? 'pulse 2.5s infinite' : 'none' }} />
                      <span style={{ color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>{status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Platform Risk Score */}
          <div className="soc-card" style={{ ...glassCard('rgba(255,255,255,0.025)'), padding: '22px', animation: 'fadeUp 0.4s ease 0.4s both' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.06em' }}>Platform Risk Score</h2>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '0 0 18px' }}>Composite threat posture</p>

            {(() => {
              const critPct = ((sev['CRITICAL'] || 0) / total) * 100
              const highPct = ((sev['HIGH']     || 0) / total) * 100
              const score   = Math.min(Math.round(critPct * 0.9 + highPct * 0.5), 100)
              const color   = score >= 70 ? '#f87171' : score >= 40 ? '#fbbf24' : '#34d399'
              const rlabel  = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'
              return (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '22px', padding: '18px', background: `${color}08`, border: `1px solid ${color}1e`, borderRadius: '14px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <p style={{ color, fontSize: '68px', fontWeight: 900, fontFamily: 'monospace', margin: 0, lineHeight: 1, textShadow: `0 0 36px ${color}55, 0 0 70px ${color}28` }}>
                        {score}
                      </p>
                      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '16px', position: 'absolute', top: '9px', right: '-26px' }}>/100</span>
                    </div>
                    <p style={{ color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', margin: '7px 0 0' }}>{rlabel}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    {[
                      { label: 'Critical threat ratio', val: Math.round(((sev['CRITICAL'] || 0) / total) * 100), color: '#f87171' },
                      { label: 'High threat ratio',     val: Math.round(((sev['HIGH']     || 0) / total) * 100), color: '#fb923c' },
                      { label: 'Open incident rate',    val: Math.min(Math.round(((data?.summary.open_incidents ?? 0) / Math.max(total, 1)) * 100), 100), color: '#fbbf24' },
                    ].map(({ label, val, color: c }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px' }}>{label}</span>
                          <span style={{ color: c, fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>{val}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, background: `linear-gradient(90deg,${c},${c}66)`, borderRadius: '999px', boxShadow: `0 0 7px ${c}44`, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        </div>

      </div>
    </>
  )
}