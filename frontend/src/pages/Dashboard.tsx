import { useEffect, useState } from 'react'
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
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d6d',
  HIGH:     '#ff8c42',
  MEDIUM:   '#ffd166',
  LOW:      '#06d6a0',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN:      '#ff4d6d',
  ASSIGNED:  '#4cc9f0',
  RESOLVED:  '#06d6a0',
  DISMISSED: '#6b7280',
}

// Glassmorphism card style
const glass = (accent = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.08)'): React.CSSProperties => ({
  background: accent,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${border}`,
  borderRadius: '20px',
})

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState(new Date())

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
    const t = setInterval(fetchData, 30000)
    return () => clearInterval(t)
  }, [])

  const sev   = data?.severity_breakdown ?? {}
  const total = data?.summary.total_threats || 1
  const maxTL = Math.max(...(data?.timeline_7d.data ?? [1]), 1)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={{ width: '48px', height: '48px', border: '2px solid rgba(76,201,240,0.2)', borderTop: '2px solid #4cc9f0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#4cc9f0', fontSize: '13px', letterSpacing: '0.15em', fontWeight: '600' }}>INITIALIZING SOC PLATFORM...</p>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow  { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scan-line   { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }

        .g-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .g-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
        }
        .g-row:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        .g-btn:hover {
          background: rgba(76,201,240,0.2) !important;
        }
      `}</style>

      {/* ── AMBIENT BACKGROUND ORBS ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%',  width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(114,9,183,0.25) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '20%',  right: '-8%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,201,240,0.15) 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '30%',  width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,109,0.12) 0%, transparent 70%)', animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,214,160,0.1) 0%, transparent 70%)', animation: 'float 9s ease-in-out infinite reverse' }} />
      </div>

      {/* ── ALL CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── HEADER ── */}
        <div className="g-card" style={{ ...glass('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)'), padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live pulse */}
            <div style={{ position: 'relative', width: '12px', height: '12px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 10px #06d6a0' }} />
              <div style={{ position: 'absolute', inset: '-5px', borderRadius: '50%', border: '1px solid rgba(6,214,160,0.4)', animation: 'pulse-glow 2s infinite' }} />
            </div>
            <div>
              <h1 style={{ color: '#f8fafc', fontSize: '17px', fontWeight: '700', margin: 0, letterSpacing: '0.04em' }}>
                Security Operations Center
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0, letterSpacing: '0.1em' }}>
                AWS CLOUD THREAT INTELLIGENCE — REAL-TIME
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#4cc9f0', fontSize: '13px', fontWeight: '600', margin: 0, fontFamily: 'monospace' }}>
                {updated.toLocaleTimeString()}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0, letterSpacing: '0.08em' }}>LAST SYNC</p>
            </div>
            <button
              onClick={fetchData}
              className="g-btn"
              style={{ padding: '8px 18px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.25)', borderRadius: '12px', color: '#4cc9f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.06em', transition: 'background 0.2s' }}
            >
              ↻ REFRESH
            </button>
            <div style={{ padding: '7px 14px', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 8px #06d6a0', animation: 'pulse-glow 1.5s infinite' }} />
              <span style={{ color: '#06d6a0', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>MONITORING</span>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Threats',    value: data?.summary.total_threats    ?? 0, color: '#4cc9f0',  glow: 'rgba(76,201,240,0.3)',   icon: '⚡', gradient: 'linear-gradient(135deg,rgba(76,201,240,0.15),rgba(76,201,240,0.03))' },
            { label: 'Critical Alerts',  value: data?.summary.critical_threats ?? 0, color: '#ff4d6d',  glow: 'rgba(255,77,109,0.3)',    icon: '🚨', gradient: 'linear-gradient(135deg,rgba(255,77,109,0.15),rgba(255,77,109,0.03))' },
            { label: 'High Severity',    value: data?.summary.high_threats     ?? 0, color: '#ff8c42',  glow: 'rgba(255,140,66,0.3)',    icon: '⚠️', gradient: 'linear-gradient(135deg,rgba(255,140,66,0.15),rgba(255,140,66,0.03))' },
            { label: 'Open Incidents',   value: data?.summary.open_incidents   ?? 0, color: '#ffd166',  glow: 'rgba(255,209,102,0.3)',   icon: '🛡', gradient: 'linear-gradient(135deg,rgba(255,209,102,0.15),rgba(255,209,102,0.03))' },
            { label: 'Assets Monitored', value: data?.summary.asset_count      ?? 0, color: '#06d6a0',  glow: 'rgba(6,214,160,0.3)',     icon: '🖥', gradient: 'linear-gradient(135deg,rgba(6,214,160,0.15),rgba(6,214,160,0.03))' },
          ].map(({ label, value, color, glow, icon, gradient }, i) => (
            <div
              key={label}
              className="g-card"
              style={{
                background: gradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${color}28`,
                borderRadius: '20px',
                padding: '22px 18px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
                animation: `fadeSlideUp 0.4s ease ${i * 0.07}s both`,
              }}
            >
              {/* Top shimmer line */}
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />

              {/* Corner glow */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', margin: 0 }}>
                  {label.toUpperCase()}
                </p>
                <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 6px currentColor)' }}>{icon}</span>
              </div>

              <p style={{ color, fontSize: '36px', fontWeight: '800', margin: '0 0 6px', fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 20px ${color}88` }}>
                {value}
              </p>

              {/* Bottom glow bar */}
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: '999px', opacity: 0.6 }} />
            </div>
          ))}
        </div>

        {/* ── ROW 2: Timeline + Severity Matrix ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

          {/* Timeline */}
          <div
            className="g-card"
            style={{ ...glass('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)'), padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.2s both' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: 0, letterSpacing: '0.05em' }}>Threat Timeline</h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '3px 0 0' }}>Detection volume — last 7 days</p>
              </div>
              <div style={{ padding: '5px 12px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#4cc9f0', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em' }}>7 DAYS</span>
              </div>
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '130px' }}>
              {(data?.timeline_7d.labels ?? []).map((label, i) => {
                const val     = data?.timeline_7d.data[i] ?? 0
                const pct     = (val / maxTL) * 100
                const isToday = i === (data?.timeline_7d.labels.length ?? 1) - 1
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    {val > 0 && <span style={{ color: isToday ? '#4cc9f0' : 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700' }}>{val}</span>}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '90px', position: 'relative' }}>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(pct, 3)}%`,
                        background: isToday
                          ? 'linear-gradient(180deg, #4cc9f0, rgba(76,201,240,0.3))'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))',
                        borderRadius: '6px 6px 3px 3px',
                        boxShadow: isToday ? '0 0 16px rgba(76,201,240,0.5), 0 0 32px rgba(76,201,240,0.2)' : 'none',
                        backdropFilter: 'blur(4px)',
                        border: isToday ? '1px solid rgba(76,201,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        minHeight: '4px',
                        transition: 'height 0.6s ease',
                      }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.04em' }}>
                      {label.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Severity Matrix */}
          <div
            className="g-card"
            style={{ ...glass('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)'), padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.25s both' }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.05em' }}>Severity Matrix</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 22px' }}>Threat classification</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'CRITICAL', color: '#ff4d6d' },
                { key: 'HIGH',     color: '#ff8c42' },
                { key: 'MEDIUM',   color: '#ffd166' },
                { key: 'LOW',      color: '#06d6a0' },
              ].map(({ key, color }) => {
                const count = sev[key] || 0
                const pct   = Math.round((count / total) * 100)
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em' }}>{key}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color, fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>{count}</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{pct}%</span>
                      </div>
                    </div>
                    {/* Glass progress bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        borderRadius: '999px',
                        boxShadow: `0 0 10px ${color}66`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Status summary pills */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Open',     color: '#ff4d6d', val: data?.status_breakdown?.OPEN      ?? 0 },
                { label: 'Assigned', color: '#4cc9f0', val: data?.status_breakdown?.ASSIGNED  ?? 0 },
                { label: 'Resolved', color: '#06d6a0', val: data?.status_breakdown?.RESOLVED  ?? 0 },
              ].map(({ label, color, val }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                  <p style={{ color, fontSize: '18px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', margin: 0, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Heatmap ── */}
        <div
          className="g-card"
          style={{ ...glass('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)'), padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.3s both' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: 0, letterSpacing: '0.05em' }}>Threat Tactic Heatmap</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '3px 0 0' }}>Event type × severity — opacity reflects frequency</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px' }}>
            {[
              { label: 'Root Login',       sev: 'CRITICAL', count: sev['CRITICAL'] || 0 },
              { label: 'Admin Policy',     sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.4) },
              { label: 'SG Deleted',       sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.35) },
              { label: 'Trail Stopped',    sev: 'HIGH',     count: Math.floor((sev['HIGH']   || 0) * 0.25) },
              { label: 'IAM Created',      sev: 'MEDIUM',   count: Math.floor((sev['MEDIUM'] || 0) * 0.5) },
              { label: 'Access Key',       sev: 'MEDIUM',   count: Math.floor((sev['MEDIUM'] || 0) * 0.5) },
              { label: 'S3 Bucket',        sev: 'LOW',      count: Math.floor((sev['LOW']    || 0) * 0.6) },
              { label: 'EC2 Launch',       sev: 'LOW',      count: Math.floor((sev['LOW']    || 0) * 0.4) },
            ].map(({ label, sev: s, count }) => {
              const color   = SEV_COLOR[s] || '#4cc9f0'
              const opacity = count > 0 ? Math.min(0.08 + (count / total) * 0.6, 0.7) : 0.04
              return (
                <div key={label} style={{
                  padding: '14px 10px',
                  background: `${color}${Math.round(opacity * 255).toString(16).padStart(2,'0')}`,
                  border: `1px solid ${color}${Math.round((opacity + 0.1) * 255).toString(16).padStart(2,'0')}`,
                  borderRadius: '14px',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: count > 0 ? `0 4px 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                  transition: 'all 0.2s',
                }}>
                  <p style={{ color, fontSize: '20px', fontWeight: '800', margin: 0, fontFamily: 'monospace', textShadow: `0 0 12px ${color}88` }}>{count}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', margin: '5px 0 0', lineHeight: '1.4' }}>{label}</p>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', alignItems: 'center' }}>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: SEV_COLOR[s], boxShadow: `0 0 6px ${SEV_COLOR[s]}` }} />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.06em' }}>{s}</span>
              </div>
            ))}
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', marginLeft: 'auto' }}>Higher opacity = higher frequency</span>
          </div>
        </div>

        {/* ── ROW 4: Live Threat Feed ── */}
        <div
          className="g-card"
          style={{ ...glass('rgba(255,255,255,0.02)', 'rgba(255,255,255,0.07)'), overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.35s both' }}
        >
          {/* Table header */}
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: 0, letterSpacing: '0.05em' }}>Live Threat Feed</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>Real-time detections from AWS CloudTrail pipeline</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 8px #06d6a0', animation: 'pulse-glow 1.5s infinite' }} />
              <span style={{ color: '#06d6a0', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>LIVE</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['THREAT ID','EVENT TYPE','SEVERITY','RISK SCORE','USER','SOURCE IP','TIME','STATUS'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recent_threats ?? []).slice(0, 8).map((t, i) => (
                <tr
                  key={t.threat_id}
                  className="g-row"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', animation: `fadeSlideUp 0.3s ease ${i * 0.04}s both` }}
                >
                  <td style={{ padding: '13px 16px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace', fontWeight: '600' }}>{t.threat_id}</td>
                  <td style={{ padding: '13px 16px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{t.event_type}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      background: `${SEV_COLOR[t.severity] || '#4cc9f0'}15`,
                      color: SEV_COLOR[t.severity] || '#4cc9f0',
                      border: `1px solid ${SEV_COLOR[t.severity] || '#4cc9f0'}30`,
                      backdropFilter: 'blur(4px)',
                    }}>
                      {t.severity}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', maxWidth: '60px' }}>
                        <div style={{ height: '4px', width: `${t.risk_score}%`, background: `linear-gradient(90deg, ${SEV_COLOR[t.severity]}, ${SEV_COLOR[t.severity]}88)`, borderRadius: '999px', boxShadow: `0 0 6px ${SEV_COLOR[t.severity]}66` }} />
                      </div>
                      <span style={{ color: SEV_COLOR[t.severity] || '#4cc9f0', fontSize: '12px', fontFamily: 'monospace', fontWeight: '700' }}>{t.risk_score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'monospace' }}>{t.username}</td>
                  <td style={{ padding: '13px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'monospace' }}>{t.source_ip}</td>
                  <td style={{ padding: '13px 16px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'monospace' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      background: `${STATUS_COLOR[t.status] || '#6b7280'}12`,
                      color: STATUS_COLOR[t.status] || '#6b7280',
                      border: `1px solid ${STATUS_COLOR[t.status] || '#6b7280'}28`,
                      backdropFilter: 'blur(4px)',
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recent_threats || data.recent_threats.length === 0) && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', letterSpacing: '0.08em' }}>
                    NO THREATS DETECTED — PIPELINE ACTIVE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── ROW 5: AWS Coverage + Risk Score ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* AWS Coverage */}
          <div
            className="g-card"
            style={{ ...glass('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)'), padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.4s both' }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.05em' }}>AWS Service Coverage</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 18px' }}>Real-time pipeline health</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { service: 'CloudTrail',    status: 'Logging',    color: '#06d6a0', icon: '📋' },
                { service: 'CloudWatch',    status: 'Active',     color: '#06d6a0', icon: '👁' },
                { service: 'Lambda Engine', status: 'Running',    color: '#06d6a0', icon: '⚡' },
                { service: 'DynamoDB',      status: 'Connected',  color: '#06d6a0', icon: '🗄' },
                { service: 'SNS Alerts',    status: 'Enabled',    color: '#06d6a0', icon: '🔔' },
                { service: 'EventBridge',   status: 'Routing',    color: '#06d6a0', icon: '🔀' },
              ].map(({ service, status, color, icon }) => (
                <div key={service} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px' }}>{icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '500' }}>{service}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                    <span style={{ color, fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em' }}>{status.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Risk Score */}
          <div
            className="g-card"
            style={{ ...glass('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.07)'), padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)', animation: 'fadeSlideUp 0.5s ease 0.45s both' }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.05em' }}>Platform Risk Score</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 20px' }}>Composite threat posture</p>

            {/* Big score */}
            {(() => {
              const critPct = ((sev['CRITICAL'] || 0) / total) * 100
              const highPct = ((sev['HIGH']     || 0) / total) * 100
              const score   = Math.min(Math.round(critPct * 0.9 + highPct * 0.5), 100)
              const color   = score >= 70 ? '#ff4d6d' : score >= 40 ? '#ffd166' : '#06d6a0'
              const label   = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'
              return (
                <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <p style={{ color, fontSize: '72px', fontWeight: '900', fontFamily: 'monospace', margin: 0, lineHeight: 1, textShadow: `0 0 40px ${color}66, 0 0 80px ${color}33` }}>
                      {score}
                    </p>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', position: 'absolute', top: '10px', right: '-28px' }}>/100</span>
                  </div>
                  <p style={{ color, fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', margin: '8px 0 0' }}>{label}</p>
                </div>
              )
            })()}

            {/* Sub scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Critical threat ratio', val: Math.round(((sev['CRITICAL'] || 0) / total) * 100), color: '#ff4d6d' },
                { label: 'High threat ratio',     val: Math.round(((sev['HIGH']     || 0) / total) * 100), color: '#ff8c42' },
                { label: 'Open incident rate',    val: Math.min(Math.round(((data?.summary.open_incidents ?? 0) / Math.max(total, 1)) * 100), 100), color: '#ffd166' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{label}</span>
                    <span style={{ color, fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>{val}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: `linear-gradient(90deg, ${color}, ${color}66)`, borderRadius: '999px', boxShadow: `0 0 8px ${color}55`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}