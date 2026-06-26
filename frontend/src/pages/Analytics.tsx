import { useEffect, useState } from 'react'
import { getSeverityDistribution, getTimeline, getTopThreats, getAnalyticsSummary } from '../services/api'
import SeverityChart from '../components/charts/SeverityChart'
import TimelineChart from '../components/charts/TimelineChart'
import TopThreatsChart from '../components/charts/TopThreatsChart'
import StatCard from '../components/StatCard'
import { TrendingUp, Clock, AlertTriangle, Activity } from 'lucide-react'

export default function Analytics() {
  const [severity, setSeverity]   = useState<any>(null)
  const [timeline, setTimeline]   = useState<any>(null)
  const [topThreats, setTop]      = useState<any>(null)
  const [summary, setSummary]     = useState<any>(null)
  const [days, setDays]           = useState(30)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [s, t, top, sum] = await Promise.all([
          getSeverityDistribution(),
          getTimeline(days),
          getTopThreats(),
          getAnalyticsSummary(),
        ])
        setSeverity(s.data)
        setTimeline(t.data)
        setTop(top.data)
        setSummary(sum.data)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [days])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm">Security intelligence and threat trends</p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Threats"   value={summary.total_threats}  icon={<Activity className="w-5 h-5 text-blue-400" />}    color="bg-blue-500/20"   />
          <StatCard title="Last 24 Hours"   value={summary.last_24h}       icon={<Clock className="w-5 h-5 text-purple-400" />}     color="bg-purple-500/20" />
          <StatCard title="Open Threats"    value={summary.open_threats}   icon={<AlertTriangle className="w-5 h-5 text-orange-400" />} color="bg-orange-500/20" />
          <StatCard title="Critical Count"  value={summary.critical_count} icon={<TrendingUp className="w-5 h-5 text-red-400" />}   color="bg-red-500/20"    />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Threats by Severity</h2>
          {severity && <SeverityChart data={severity} />}
        </div>
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Threat Timeline</h2>
          {timeline && <TimelineChart data={timeline} days={days} />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Top Threat Types</h2>
        {topThreats && <TopThreatsChart data={topThreats} />}
      </div>
    </div>
  )
}