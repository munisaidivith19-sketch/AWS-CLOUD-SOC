import { useEffect, useState, useRef } from 'react'
import { pollUpdates, getAuditLogs } from '../services/api'

interface LiveEvent {
  threat_id: string
  event_type: string
  raw_event_name?: string
  severity: string
  risk_score: number
  username: string
  source_ip: string
  region: string
  timestamp: string
  status: string
  description: string
  ai_analysis?: string
  mitre?: string
}

interface AuditLog {
  log_id: string
  action: string
  timestamp: string
  user: string
  source_ip: string
  region: string
  event_source: string
  user_agent?: string
  account_id?: string
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d6d', HIGH: '#ff8c42', MEDIUM: '#ffd166', LOW: '#06d6a0'
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

export default function LiveMonitor() {
  const [pollData, setPollData]     = useState<any>(null)
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([])
  const [selected, setSelected]     = useState<LiveEvent | null>(null)
  const [activeTab, setActiveTab]   = useState<'threats' | 'audit'>('threats')
  const [filterSev, setFilterSev]   = useState('')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [countdown, setCountdown]   = useState(15)
  const intervalRef                 = useRef<any>(null)
  const countdownRef                = useRef<any>(null)

  const fetchAll = async () => {
    try {
      const [pollRes, auditRes] = await Promise.all([
        pollUpdates(),
        getAuditLogs(200),
      ])
      setPollData(pollRes.data)
      setAuditLogs(auditRes.data.logs || [])
      setLastUpdate(new Date())
      setCountdown(15)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current   = setInterval(fetchAll, 15000)
      countdownRef.current  = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 15), 1000)
    } else {
      clearInterval(intervalRef.current)
      clearInterval(countdownRef.current)
    }
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(countdownRef.current)
    }
  }, [autoRefresh])

  const threats: LiveEvent[] = pollData?.recent_threats || []

  const filteredThreats = threats.filter(e => {
    const matchSev    = !filterSev || e.severity === filterSev
    const matchSearch = !search ||
      (e.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.username   || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.source_ip  || '').includes(search) ||
      (e.raw_event_name || '').toLowerCase().includes(search.toLowerCase())
    return matchSev && matchSearch
  })

  const filteredAudit = auditLogs.filter(a =>
    !search ||
    (a.action     || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.user       || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.source_ip  || '').includes(search)
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: '#4cc9f0', letterSpacing: '0.1em' }}>LOADING LIVE MONITOR...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @keyframes pulse-glow{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .lm-row:hover{background:rgba(255,255,255,0.04)!important;cursor:pointer}
      `}</style>

      {/* Header */}
      <div style={{ ...glass, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: autoRefresh ? '#06d6a0' : '#ff4d6d', boxShadow: `0 0 10px ${autoRefresh ? '#06d6a0' : '#ff4d6d'}`, animation: autoRefresh ? 'pulse-glow 1.5s infinite' : 'none' }} />
          </div>
          <div>
            <h1 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: 0 }}>Live Security Monitor</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
              Real-time CloudTrail event feed · Updated: {lastUpdate.toLocaleTimeString()} · {autoRefresh ? `Next refresh in ${countdown}s` : 'Paused'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ padding: '7px 14px', background: autoRefresh ? 'rgba(6,214,160,0.1)' : 'rgba(255,77,109,0.1)', border: `1px solid ${autoRefresh ? 'rgba(6,214,160,0.3)' : 'rgba(255,77,109,0.3)'}`, borderRadius: '10px', color: autoRefresh ? '#06d6a0' : '#ff4d6d', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            {autoRefresh ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
          <button onClick={fetchAll}
            style={{ padding: '7px 14px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.25)', borderRadius: '10px', color: '#4cc9f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            ↻ REFRESH NOW
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Threats',    value: pollData?.total_threats    ?? 0, color: '#4cc9f0' },
          { label: 'Critical',         value: pollData?.critical_count   ?? 0, color: '#ff4d6d' },
          { label: 'Open',             value: pollData?.open_count       ?? 0, color: '#ff8c42' },
          { label: 'API Calls (24h)',  value: pollData?.login_activity?.api_calls_24h    ?? 0, color: '#ffd166' },
          { label: 'Active Users (24h)',value: pollData?.login_activity?.active_users_24h ?? 0, color: '#06d6a0' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...glass, padding: '14px 16px', borderColor: `${color}22` }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 6px' }}>{label.toUpperCase()}</p>
            <p style={{ color, fontSize: '26px', fontWeight: '800', margin: 0, fontFamily: 'monospace', textShadow: `0 0 16px ${color}66` }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Attack Chains */}
      {pollData?.attack_chains?.length > 0 && (
        <div style={{ ...glass, padding: '18px', borderColor: 'rgba(255,77,109,0.25)' }}>
          <h2 style={{ color: '#ff4d6d', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>
            🔗 ATTACK CHAINS DETECTED ({pollData.attack_chains.length})
          </h2>
          {pollData.attack_chains.map((chain: any) => (
            <div key={chain.chain_id} style={{ padding: '12px', background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#ff4d6d', fontWeight: '700', fontSize: '12px' }}>{chain.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace' }}>{chain.mitre}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: '0 0 8px' }}>{chain.description}</p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {chain.events?.map((ev: string, i: number, arr: string[]) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ padding: '2px 7px', background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: '4px', color: '#ff4d6d', fontSize: '10px', fontFamily: 'monospace' }}>{ev}</span>
                    {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px' }}>
          {(['threats', 'audit'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: activeTab === tab ? 'rgba(76,201,240,0.2)' : 'transparent', color: activeTab === tab ? '#4cc9f0' : 'rgba(255,255,255,0.4)' }}>
              {tab === 'threats' ? `⚠️ Threats (${filteredThreats.length})` : `📋 Audit Logs (${filteredAudit.length})`}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..."
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '7px 14px', color: 'white', fontSize: '13px', outline: 'none', width: '220px' }} />
        {activeTab === 'threats' && ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
          <button key={s} onClick={() => setFilterSev(s)}
            style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600', background: filterSev === s ? '#2563eb' : 'rgba(255,255,255,0.05)', color: filterSev === s ? 'white' : 'rgba(255,255,255,0.45)' }}>
            {s || 'ALL'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '16px' }}>

        {/* Threats Table */}
        {activeTab === 'threats' && (
          <div style={{ ...glass, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  {['TIME','EVENT','SEVERITY','RISK','USER','SOURCE IP','REGION','STATUS'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredThreats.slice(0, 100).map((ev, i) => (
                  <tr key={ev.threat_id} className="lm-row" onClick={() => setSelected(selected?.threat_id === ev.threat_id ? null : ev)}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected?.threat_id === ev.threat_id ? 'rgba(76,201,240,0.06)' : 'transparent', transition: 'background 0.15s', animation: `fadeIn 0.2s ease ${Math.min(i,20)*0.02}s both` }}>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.8)', fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.raw_event_name || ev.event_type}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '9px', fontWeight: '700', background: `${SEV_COLOR[ev.severity]}18`, color: SEV_COLOR[ev.severity], border: `1px solid ${SEV_COLOR[ev.severity]}30` }}>
                        {ev.severity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '32px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
                          <div style={{ height: '3px', width: `${ev.risk_score}%`, background: SEV_COLOR[ev.severity], borderRadius: '999px' }} />
                        </div>
                        <span style={{ color: SEV_COLOR[ev.severity], fontSize: '10px', fontFamily: 'monospace', fontWeight: '700' }}>{ev.risk_score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'monospace' }}>{ev.username}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'monospace' }}>{ev.source_ip}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{ev.region}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '9px', fontWeight: '600', color: ev.status === 'OPEN' ? '#ff4d6d' : '#06d6a0', background: ev.status === 'OPEN' ? 'rgba(255,77,109,0.1)' : 'rgba(6,214,160,0.1)' }}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredThreats.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', letterSpacing: '0.08em' }}>
                    NO THREATS — PIPELINE MONITORING ACTIVE · TRIGGER A CLOUDTRAIL EVENT TO SEE DATA
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Logs Table */}
        {activeTab === 'audit' && (
          <div style={{ ...glass, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  {['TIME','ACTION','USER','SOURCE IP','SERVICE','REGION','ACCOUNT'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAudit.slice(0, 100).map((log, i) => (
                  <tr key={log.log_id} className="lm-row"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', animation: `fadeIn 0.2s ease ${Math.min(i,20)*0.02}s both` }}>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace' }}>{log.action}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{log.user}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'monospace' }}>{log.source_ip}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                      {(log.event_source || '').split('.')[0].toUpperCase()}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{log.region}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', fontFamily: 'monospace' }}>{log.account_id}</td>
                  </tr>
                ))}
                {filteredAudit.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', letterSpacing: '0.08em' }}>
                    NO AUDIT LOGS — CLOUDTRAIL EVENTS WILL APPEAR HERE AUTOMATICALLY
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Panel */}
        {selected && activeTab === 'threats' && (
          <div style={{ ...glass, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: 0 }}>Event Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: `${SEV_COLOR[selected.severity]}08`, border: `1px solid ${SEV_COLOR[selected.severity]}25`, borderRadius: '10px' }}>
              <p style={{ color: SEV_COLOR[selected.severity], fontSize: '18px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{selected.severity}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '3px 0 0' }}>Risk Score: {selected.risk_score}/100</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11px' }}>
              {[
                ['Threat ID',   selected.threat_id],
                ['Event Name',  selected.raw_event_name || selected.event_type],
                ['Event Type',  selected.event_type],
                ['Username',    selected.username],
                ['Source IP',   selected.source_ip],
                ['Region',      selected.region],
                ['Time',        new Date(selected.timestamp).toLocaleString()],
                ['MITRE',       selected.mitre || 'N/A'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', paddingBottom: '7px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: '72px', flexShrink: 0 }}>{k}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>
            {selected.description && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                <p style={{ color: '#4cc9f0', fontSize: '9px', fontWeight: '700', margin: '0 0 5px', letterSpacing: '0.08em' }}>DESCRIPTION</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>{selected.description}</p>
              </div>
            )}
            {selected.ai_analysis && (
              <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px', padding: '10px' }}>
                <p style={{ color: '#a78bfa', fontSize: '9px', fontWeight: '700', margin: '0 0 5px', letterSpacing: '0.08em' }}>🤖 AI ANALYSIS</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>{selected.ai_analysis}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}