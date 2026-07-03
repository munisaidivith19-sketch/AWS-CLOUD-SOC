import { useEffect, useState } from 'react'
import { getIncidents, assignIncident, resolveIncident } from '../services/api'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

interface Incident {
  incident_id: string
  threat_id: string
  status: string
  severity?: string
  event_type?: string
  assigned_to?: string
  notes?: string
  resolution_notes?: string
  created_at: string
  updated_at?: string
  resolved_at?: string
}

export default function Incidents() {
  const [incidents, setIncidents]   = useState<Incident[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Incident | null>(null)
  const [filterSt, setFilterSt]     = useState('')
  const [assignTo, setAssignTo]     = useState('')
  const [notes, setNotes]           = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [action, setAction]         = useState<'assign' | 'resolve' | null>(null)
  const { user } = useAuth()

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const res = await getIncidents({ status: filterSt || undefined })
      setIncidents(res.data.items || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchIncidents() }, [filterSt])

  const handleAssign = async () => {
    if (!selected || !assignTo) return
    await assignIncident(selected.incident_id, assignTo, notes)
    setAction(null)
    setAssignTo('')
    setNotes('')
    fetchIncidents()
  }

  const handleResolve = async () => {
    if (!selected || !resolveNotes) return
    await resolveIncident(selected.incident_id, resolveNotes, user?.username || 'analyst')
    setAction(null)
    setResolveNotes('')
    fetchIncidents()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Incident Management</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>{incidents.length} incidents</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'OPEN', 'ASSIGNED', 'RESOLVED'].map(s => (
            <button key={s} onClick={() => setFilterSt(s)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', background: filterSt === s ? '#2563eb' : '#1f2937', color: filterSt === s ? 'white' : '#9ca3af' }}>
              {s || 'All'}
            </button>
          ))}
          <button onClick={fetchIncidents}
            style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer' }}>
            ↻
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '20px' }}>

        {/* Table */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading incidents...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', background: 'rgba(31,41,55,0.5)' }}>
                  {['Incident ID', 'Threat ID', 'Event', 'Severity', 'Assigned To', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.incident_id} onClick={() => setSelected(inc)}
                    style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selected?.incident_id === inc.incident_id ? 'rgba(37,99,235,0.1)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', color: '#60a5fa', fontSize: '12px', fontFamily: 'monospace' }}>{inc.incident_id}</td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace' }}>{inc.threat_id}</td>
                    <td style={{ padding: '12px 16px', color: '#d1d5db', fontSize: '13px' }}>{inc.event_type || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {inc.severity ? <SeverityBadge severity={inc.severity} /> : <span style={{ color: '#6b7280' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{inc.assigned_to || 'Unassigned'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={inc.status} /></td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                      No incidents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>Incident Detail</h3>
              <button onClick={() => { setSelected(null); setAction(null) }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              {[
                ['Incident ID', selected.incident_id],
                ['Threat ID',   selected.threat_id],
                ['Event',       selected.event_type || '—'],
                ['Created',     new Date(selected.created_at).toLocaleString()],
                ['Assigned To', selected.assigned_to || 'Unassigned'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1f2937' }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ color: '#d1d5db', fontSize: '12px', fontFamily: 'monospace' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Status</span>
                <StatusBadge status={selected.status} />
              </div>
              {selected.severity && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Severity</span>
                  <SeverityBadge severity={selected.severity} />
                </div>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div style={{ background: '#1f2937', borderRadius: '8px', padding: '12px' }}>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px' }}>Notes</p>
                <p style={{ color: '#d1d5db', fontSize: '13px', margin: 0 }}>{selected.notes}</p>
              </div>
            )}

            {/* Resolution */}
            {selected.resolution_notes && (
              <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ color: '#4ade80', fontSize: '11px', margin: '0 0 4px' }}>Resolution</p>
                <p style={{ color: '#d1d5db', fontSize: '13px', margin: 0 }}>{selected.resolution_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {user?.role !== 'viewer' && selected.status !== 'RESOLVED' && !action && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setAction('assign')}
                  style={{ flex: 1, background: '#2563eb', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                  Assign
                </button>
                <button onClick={() => setAction('resolve')}
                  style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                  Resolve
                </button>
              </div>
            )}

            {/* Assign Form */}
            {action === 'assign' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
                <input
                  value={assignTo}
                  onChange={e => setAssignTo(e.target.value)}
                  placeholder="Assign to username"
                  style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '13px', outline: 'none' }}
                />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes..."
                  rows={3}
                  style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setAction(null)}
                    style={{ flex: 1, background: '#374151', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button onClick={handleAssign}
                    style={{ flex: 1, background: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Resolve Form */}
            {action === 'resolve' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Resolution notes..."
                  rows={3}
                  style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setAction(null)}
                    style={{ flex: 1, background: '#374151', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button onClick={handleResolve}
                    style={{ flex: 1, background: '#16a34a', border: 'none', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                    Resolve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}