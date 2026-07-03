import { useEffect, useState } from 'react'
import { getThreats, createThreat, updateThreatStatus } from '../services/api'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import AIAssistant from '../components/AIAssistant'
import { useAuth } from '../context/AuthContext'

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
  resource_id?: string
  ai_analysis?: string
  recommendations?: string[]
}

export default function Threats() {
  const [threats, setThreats]       = useState<Threat[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Threat | null>(null)
  const [filterSev, setFilterSev]   = useState('')
  const [filterSt, setFilterSt]     = useState('')
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    event_type: '', source_ip: '', username: '', description: ''
  })
  const { user } = useAuth()

  const fetchThreats = async () => {
    setLoading(true)
    try {
      const res = await getThreats({
        severity: filterSev || undefined,
        status:   filterSt  || undefined,
        limit:    100
      })
      setThreats(res.data.items || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchThreats() }, [filterSev, filterSt])

  const filtered = threats.filter(t =>
    search === '' ||
    t.threat_id.toLowerCase().includes(search.toLowerCase()) ||
    t.event_type.toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.source_ip.includes(search)
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createThreat(form)
    setShowCreate(false)
    setForm({ event_type: '', source_ip: '', username: '', description: '' })
    fetchThreats()
  }

  const handleStatus = async (id: string, status: string) => {
    await updateThreatStatus(id, status)
    fetchThreats()
    setSelected(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Threat Monitor</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>{threats.length} threats detected</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchThreats}
            style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer' }}>
            ↻ Refresh
          </button>
          {user?.role !== 'viewer' && (
            <button onClick={() => setShowCreate(true)}
              style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
              + Create Threat
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search threats..."
          style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: 'white', fontSize: '14px', outline: 'none', width: '240px' }}
        />
        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
          <button key={s} onClick={() => setFilterSev(s)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', background: filterSev === s ? '#2563eb' : '#1f2937', color: filterSev === s ? 'white' : '#9ca3af' }}>
            {s || 'All Severity'}
          </button>
        ))}
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
          style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#9ca3af', fontSize: '13px', outline: 'none' }}>
          <option value="">All Status</option>
          {['OPEN', 'ASSIGNED', 'RESOLVED', 'DISMISSED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px' }}>

        {/* Table */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading threats...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937', background: 'rgba(31,41,55,0.5)' }}>
                    {['ID', 'Event', 'Severity', 'User', 'Source IP', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.threat_id} onClick={() => setSelected(t)}
                      style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selected?.threat_id === t.threat_id ? 'rgba(37,99,235,0.1)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', color: '#60a5fa', fontSize: '12px', fontFamily: 'monospace' }}>{t.threat_id}</td>
                      <td style={{ padding: '12px 16px', color: '#d1d5db', fontSize: '13px' }}>{t.event_type}</td>
                      <td style={{ padding: '12px 16px' }}><SeverityBadge severity={t.severity} /></td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{t.username}</td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace' }}>{t.source_ip}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>👁</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                        No threats found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>Threat Detail</h3>
                <button onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {[
                  ['ID',         selected.threat_id],
                  ['Event',      selected.event_type],
                  ['Risk Score', `${selected.risk_score}/100`],
                  ['Source IP',  selected.source_ip],
                  ['Username',   selected.username],
                  ['Region',     selected.region],
                  ['Time',       new Date(selected.timestamp).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1f2937' }}>
                    <span style={{ color: '#6b7280' }}>{k}</span>
                    <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: '12px' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Severity</span>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: '1.6', marginTop: '12px', borderTop: '1px solid #1f2937', paddingTop: '12px' }}>
                {selected.description}
              </p>

              {user?.role !== 'viewer' && selected.status !== 'RESOLVED' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleStatus(selected.threat_id, 'DISMISSED')}
                    style={{ flex: 1, background: '#374151', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Dismiss
                  </button>
                  <button onClick={() => handleStatus(selected.threat_id, 'RESOLVED')}
                    style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Resolve
                  </button>
                </div>
              )}
            </div>

            <AIAssistant threat={selected} />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Create Manual Threat</h3>
            <form onSubmit={handleCreate}>
              {[
                { label: 'Event Type', key: 'event_type', placeholder: 'e.g. ConsoleLogin_Root' },
                { label: 'Source IP',  key: 'source_ip',  placeholder: 'e.g. 203.0.113.1'      },
                { label: 'Username',   key: 'username',   placeholder: 'e.g. attacker'          },
                { label: 'Description', key: 'description', placeholder: 'Describe the threat...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ flex: 1, background: '#374151', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, background: '#2563eb', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', cursor: 'pointer' }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}