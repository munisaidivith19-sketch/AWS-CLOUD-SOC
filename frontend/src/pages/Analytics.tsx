import { useEffect, useState } from 'react'
import {
  getSeverityDistribution, getTimeline, getTopThreats,
  getAnalyticsSummary, getActiveUsers, getTopIPs,
  getRiskTrend, getIncidentTrend, getAuditLogStats
} from '../services/api'
import SeverityChart   from '../components/charts/SeverityChart'
import TimelineChart   from '../components/charts/TimelineChart'
import TopThreatsChart from '../components/charts/TopThreatsChart'
import StatCard        from '../components/StatCard'

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

export default function Analytics() {
  const [severity,  setSeverity]  = useState<any>(null)
  const [timeline,  setTimeline]  = useState<any>(null)
  const [top,       setTop]       = useState<any>(null)
  const [summary,   setSummary]   = useState<any>(null)
  const [users,     setUsers]     = useState<any>(null)
  const [ips,       setIPs]       = useState<any>(null)
  const [riskTrend, setRiskTrend] = useState<any>(null)
  const [incTrend,  setIncTrend]  = useState<any>(null)
  const [auditStats,setAuditStats]= useState<any>(null)
  const [days,      setDays]      = useState(30)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [s, t, tp, sm, u, ip, rt, it, al] = await Promise.all([
          getSeverityDistribution(),
          getTimeline(days),
          getTopThreats(),
          getAnalyticsSummary(),
          getActiveUsers(),
          getTopIPs(),
          getRiskTrend(),
          getIncidentTrend(),
          getAuditLogStats(),
        ])
        setSeverity(s.data)
        setTimeline(t.data)
        setTop(tp.data)
        setSummary(sm.data)
        setUsers(u.data)
        setIPs(ip.data)
        setRiskTrend(rt.data)
        setIncTrend(it.data)
        setAuditStats(al.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [days])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <p style={{ color: '#4cc9f0', letterSpacing: '0.1em' }}>LOADING ANALYTICS...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700', margin: 0 }}>Security Analytics</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '3px 0 0' }}>Live intelligence from AWS CloudTrail and DynamoDB</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', color: '#d1d5db', fontSize: '13px', outline: 'none' }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <StatCard title="Total Threats"    value={summary.total_threats}   icon={<span style={{fontSize:'18px'}}>⚡</span>} color="rgba(76,201,240,0.15)"  />
          <StatCard title="Last 24 Hours"    value={summary.last_24h}        icon={<span style={{fontSize:'18px'}}>🕐</span>} color="rgba(139,92,246,0.15)" />
          <StatCard title="Open Incidents"   value={summary.open_incidents}  icon={<span style={{fontSize:'18px'}}>🛡️</span>} color="rgba(255,140,66,0.15)"  />
          <StatCard title="Total API Calls"  value={summary.total_api_calls ?? 0} icon={<span style={{fontSize:'18px'}}>📡</span>} color="rgba(6,214,160,0.15)" />
        </div>
      )}

      {/* Audit Stats */}
      {auditStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <StatCard title="Total Events (Audit)" value={auditStats.total_events}  icon={<span style={{fontSize:'18px'}}>📋</span>} color="rgba(76,201,240,0.1)" />
          <StatCard title="Events (24h)"          value={auditStats.events_24h}    icon={<span style={{fontSize:'18px'}}>🔍</span>} color="rgba(255,209,102,0.1)" />
          <StatCard title="Critical Count"        value={summary?.critical_count ?? 0} icon={<span style={{fontSize:'18px'}}>🚨</span>} color="rgba(255,77,109,0.1)" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 16px', letterSpacing: '0.05em' }}>Threats by Severity</h2>
          {severity && <SeverityChart data={severity} />}
        </div>
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>Threat Timeline</h2>
          {timeline && <TimelineChart data={timeline} days={days} />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>Top Threat Types</h2>
          {top && <TopThreatsChart data={top} />}
        </div>
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>Risk Score Trend (30d avg)</h2>
          {riskTrend && <TimelineChart data={riskTrend} days={30} />}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Top Users */}
        {users?.labels?.length > 0 && (
          <div style={{ ...glass, padding: '20px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>Most Active Users (by threats)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.labels.map((label: string, i: number) => {
                const max = Math.max(...users.data)
                const pct = max > 0 ? (users.data[i] / max) * 100 : 0
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'monospace' }}>{label}</span>
                      <span style={{ color: '#4cc9f0', fontSize: '12px', fontWeight: '700' }}>{users.data[i]}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }}>
                      <div style={{ height: '4px', width: `${pct}%`, background: 'linear-gradient(90deg,#4cc9f0,#4cc9f066)', borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top IPs */}
        {ips?.labels?.length > 0 && (
          <div style={{ ...glass, padding: '20px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>Top Source IPs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ips.labels.map((label: string, i: number) => {
                const max = Math.max(...ips.data)
                const pct = max > 0 ? (ips.data[i] / max) * 100 : 0
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'monospace' }}>{label}</span>
                      <span style={{ color: '#ff8c42', fontSize: '12px', fontWeight: '700' }}>{ips.data[i]}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }}>
                      <div style={{ height: '4px', width: `${pct}%`, background: 'linear-gradient(90deg,#ff8c42,#ff8c4266)', borderRadius: '999px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Incident Trend */}
      {incTrend && (
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>Incident Trend (30d)</h2>
          <TimelineChart data={incTrend} days={30} />
        </div>
      )}

      {/* Top AWS Services from Audit */}
      {auditStats?.top_services?.labels?.length > 0 && (
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>Top AWS Services (from Audit Logs)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {auditStats.top_services.labels.map((label: string, i: number) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                <p style={{ color: '#4cc9f0', fontSize: '20px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{auditStats.top_services.data[i]}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '4px 0 0' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}