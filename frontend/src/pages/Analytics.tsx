import { useEffect, useState } from 'react'
import { getSeverityDistribution, getTimeline, getTopThreats, getAnalyticsSummary } from '../services/api'
import SeverityChart from '../components/charts/SeverityChart'
import TimelineChart from '../components/charts/TimelineChart'
import TopThreatsChart from '../components/charts/TopThreatsChart'
import StatCard from '../components/StatCard'

export default function Analytics() {
  const [severity, setSeverity] = useState<any>(null)
  const [timeline, setTimeline] = useState<any>(null)
  const [top, setTop]           = useState<any>(null)
  const [summary, setSummary]   = useState<any>(null)
  const [days, setDays]         = useState(30)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [s, t, tp, sm] = await Promise.all([
          getSeverityDistribution(),
          getTimeline(days),
          getTopThreats(),
          getAnalyticsSummary(),
        ])
        setSeverity(s.data)
        setTimeline(t.data)
        setTop(tp.data)
        setSummary(sm.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [days])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ color: '#60a5fa' }}>Loading analytics...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Analytics</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>Security intelligence and threat trends</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#d1d5db', fontSize: '14px', outline: 'none' }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <StatCard title="Total Threats"  value={summary.total_threats}  icon={<span style={{ fontSize: '18px' }}>📊</span>} color="rgba(59,130,246,0.15)"  />
          <StatCard title="Last 24 Hours"  value={summary.last_24h}       icon={<span style={{ fontSize: '18px' }}>🕐</span>} color="rgba(139,92,246,0.15)" />
          <StatCard title="Open Threats"   value={summary.open_threats}   icon={<span style={{ fontSize: '18px' }}>⚠️</span>} color="rgba(249,115,22,0.15)" />
          <StatCard title="Critical Count" value={summary.critical_count} icon={<span style={{ fontSize: '18px' }}>🚨</span>} color="rgba(239,68,68,0.15)"  />
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Threats by Severity</h2>
          {severity && <SeverityChart data={severity} />}
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>Threat Timeline</h2>
          {timeline && <TimelineChart data={timeline} days={days} />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>Top Threat Types</h2>
        {top && <TopThreatsChart data={top} />}
      </div>
    </div>
  )
}