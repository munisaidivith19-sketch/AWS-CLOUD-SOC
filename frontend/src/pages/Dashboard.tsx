import { useEffect, useState } from 'react'
import { AlertTriangle, Shield, Monitor, Activity, RefreshCw } from 'lucide-react'
import { getDashboard } from '../services/api'
import { DashboardData, Threat } from '../types'
import StatCard from '../components/StatCard'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import TimelineChart from '../components/charts/TimelineChart'

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SOC Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time AWS security monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Threats"
          value={data?.summary.total_threats ?? 0}
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/20"
          subtitle="All time"
        />
        <StatCard
          title="Critical Threats"
          value={data?.summary.critical_threats ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          color="bg-red-500/20"
          subtitle="Needs immediate action"
        />
        <StatCard
          title="Open Incidents"
          value={data?.summary.open_incidents ?? 0}
          icon={<Shield className="w-5 h-5 text-orange-400" />}
          color="bg-orange-500/20"
          subtitle="Awaiting response"
        />
        <StatCard
          title="Assets Monitored"
          value={data?.summary.asset_count ?? 0}
          icon={<Monitor className="w-5 h-5 text-green-400" />}
          color="bg-green-500/20"
          subtitle="AWS resources"
        />
      </div>

      {/* Charts + Recent Threats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Threat Activity — Last 7 Days</h2>
          {data?.timeline_7d && <TimelineChart data={data.timeline_7d} />}
        </div>

        {/* Severity Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Severity Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(data?.severity_breakdown ?? {}).map(([sev, count]) => {
              const total = data?.summary.total_threats || 1
              const pct   = Math.round((count / total) * 100)
              const colors: Record<string, string> = {
                CRITICAL: 'bg-red-500',
                HIGH:     'bg-orange-500',
                MEDIUM:   'bg-yellow-500',
                LOW:      'bg-blue-500',
              }
              return (
                <div key={sev}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{sev}</span>
                    <span className="text-white font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div
                      className={`h-2 rounded-full ${colors[sev] || 'bg-gray-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Threats Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">Recent Threats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Threat ID', 'Event', 'Severity', 'User', 'Source IP', 'Time', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data?.recent_threats?.map((t: Threat) => (
                <tr key={t.threat_id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-blue-400 text-sm font-mono">{t.threat_id}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{t.event_type}</td>
                  <td className="px-6 py-4"><SeverityBadge severity={t.severity} /></td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{t.username}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm font-mono">{t.source_ip}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(t.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
              {(!data?.recent_threats || data.recent_threats.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No threats detected yet. Run a Lambda test event to generate data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}