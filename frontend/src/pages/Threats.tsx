import { useEffect, useState } from 'react'
import { Search, Filter, RefreshCw, Plus, Eye } from 'lucide-react'
import { getThreats, createThreat, updateThreatStatus } from '../services/api'
import { Threat } from '../types'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import AIAssistant from '../components/AIAssistant'
import { useAuth } from '../context/AuthContext'

export default function Threats() {
  const [threats, setThreats]         = useState<Threat[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Threat | null>(null)
  const [filterSev, setFilterSev]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch]           = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [createForm, setCreateForm]   = useState({
    event_type: '', source_ip: '', username: '', description: ''
  })
  const { user } = useAuth()

  const fetchThreats = async () => {
    setLoading(true)
    try {
      const res = await getThreats({
        severity: filterSev || undefined,
        status:   filterStatus || undefined,
        limit:    100
      })
      setThreats(res.data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchThreats() }, [filterSev, filterStatus])

  const filtered = threats.filter(t =>
    search === '' ||
    t.threat_id.toLowerCase().includes(search.toLowerCase()) ||
    t.event_type.toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.source_ip.includes(search)
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createThreat(createForm)
    setShowCreate(false)
    setCreateForm({ event_type: '', source_ip: '', username: '', description: '' })
    fetchThreats()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await updateThreatStatus(id, status)
    fetchThreats()
    if (selected?.threat_id === id) setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Threat Monitor</h1>
          <p className="text-gray-400 text-sm">{threats.length} threats detected</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchThreats} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {user?.role !== 'viewer' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Threat
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search threats..."
            className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
        <select
          value={filterSev}
          onChange={e => setFilterSev(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none"
        >
          <option value="">All Severities</option>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          {['OPEN','ASSIGNED','RESOLVED','DISMISSED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Threat Table */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    {['ID', 'Event', 'Severity', 'User', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(t => (
                    <tr
                      key={t.threat_id}
                      className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${selected?.threat_id === t.threat_id ? 'bg-blue-900/20' : ''}`}
                      onClick={() => setSelected(t)}
                    >
                      <td className="px-4 py-3 text-blue-400 text-xs font-mono">{t.threat_id}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{t.event_type}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={t.severity} /></td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{t.username}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        <Eye className="w-4 h-4 text-gray-500 hover:text-blue-400" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No threats found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Threat Detail Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Threat Detail</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">×</button>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    ['ID',          selected.threat_id],
                    ['Event',       selected.event_type],
                    ['Risk Score',  `${selected.risk_score}/100`],
                    ['Source IP',   selected.source_ip],
                    ['Username',    selected.username],
                    ['Region',      selected.region],
                    ['Time',        new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-400">{k}</span>
                      <span className="text-gray-200 font-mono text-xs">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Severity</span>
                    <SeverityBadge severity={selected.severity} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed border-t border-gray-800 pt-3">
                  {selected.description}
                </p>
                {user?.role !== 'viewer' && (
                  <div className="flex gap-2 pt-2">
                    {selected.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusChange(selected.threat_id, 'DISMISSED')}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded-lg transition-all"
                      >
                        Dismiss
                      </button>
                    )}
                    {selected.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleStatusChange(selected.threat_id, 'RESOLVED')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded-lg transition-all"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
              <AIAssistant threat={selected} />
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Eye className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Click a threat to view details and AI analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Threat Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Create Manual Threat</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Event Type', key: 'event_type', placeholder: 'e.g. ConsoleLogin_Root' },
                { label: 'Source IP',  key: 'source_ip',  placeholder: 'e.g. 192.168.1.1' },
                { label: 'Username',   key: 'username',   placeholder: 'e.g. attacker' },
                { label: 'Description', key: 'description', placeholder: 'Describe the threat...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-gray-400 text-sm mb-1">{f.label}</label>
                  <input
                    value={createForm[f.key as keyof typeof createForm]}
                    onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm transition-all">
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