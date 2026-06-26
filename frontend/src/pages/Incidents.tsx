import { useEffect, useState } from 'react'
import { RefreshCw, Shield } from 'lucide-react'
import { getIncidents, assignIncident, resolveIncident } from '../services/api'
import { Incident } from '../types'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Incident | null>(null)
  const [filterStatus, setFilter] = useState('')
  const [assignTo, setAssignTo]   = useState('')
  const [notes, setNotes]         = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [action, setAction]       = useState<'assign' | 'resolve' | null>(null)
  const { user } = useAuth()

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const res = await getIncidents({ status: filterStatus || undefined })
      setIncidents(res.data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIncidents() }, [filterStatus])

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Management</h1>
          <p className="text-gray-400 text-sm">{incidents.length} incidents</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            {['OPEN','ASSIGNED','RESOLVED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={fetchIncidents} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  {['Incident ID', 'Threat ID', 'Event', 'Severity', 'Assigned To', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {incidents.map(inc => (
                  <tr
                    key={inc.incident_id}
                    onClick={() => setSelected(inc)}
                    className={`cursor-pointer hover:bg-gray-800/50 transition-colors ${selected?.incident_id === inc.incident_id ? 'bg-blue-900/20' : ''}`}
                  >
                    <td className="px-4 py-3 text-blue-400 text-xs font-mono">{inc.incident_id}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{inc.threat_id}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{inc.event_type || '—'}</td>
                    <td className="px-4 py-3">
                      {inc.severity ? <SeverityBadge severity={inc.severity} /> : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{inc.assigned_to || 'Unassigned'}</td>
                    <td className="px-4 py-3"><StatusBadge status={inc.status} /></td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No incidents found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Incident Detail */}
        <div className="space-y-4">
          {selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Incident Detail</h3>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">×</button>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  ['Incident ID', selected.incident_id],
                  ['Threat ID',   selected.threat_id],
                  ['Created',     new Date(selected.created_at).toLocaleString()],
                  ['Assigned To', selected.assigned_to || 'Unassigned'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-gray-200 text-xs font-mono">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              {selected.notes && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-300 text-sm">{selected.notes}</p>
                </div>
              )}

              {selected.resolution_notes && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-xs mb-1">Resolution</p>
                  <p className="text-gray-300 text-sm">{selected.resolution_notes}</p>
                </div>
              )}

              {user?.role !== 'viewer' && selected.status !== 'RESOLVED' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setAction('assign')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg transition-all"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => setAction('resolve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded-lg transition-all"
                  >
                    Resolve
                  </button>
                </div>
              )}

              {/* Assign Form */}
              {action === 'assign' && (
                <div className="space-y-3 border-t border-gray-800 pt-4">
                  <input
                    value={assignTo}
                    onChange={e => setAssignTo(e.target.value)}
                    placeholder="Assign to (username)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                  />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 bg-gray-700 text-white text-xs py-2 rounded-lg">Cancel</button>
                    <button onClick={handleAssign} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg">Confirm</button>
                  </div>
                </div>
              )}

              {/* Resolve Form */}
              {action === 'resolve' && (
                <div className="space-y-3 border-t border-gray-800 pt-4">
                  <textarea
                    value={resolveNotes}
                    onChange={e => setResolveNotes(e.target.value)}
                    placeholder="Resolution notes..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 bg-gray-700 text-white text-xs py-2 rounded-lg">Cancel</button>
                    <button onClick={handleResolve} className="flex-1 bg-green-600 text-white text-xs py-2 rounded-lg">Resolve</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Shield className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Click an incident to manage it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}