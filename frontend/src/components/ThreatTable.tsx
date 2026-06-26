import { Threat } from '../types'
import SeverityBadge from './SeverityBadge'
import StatusBadge from './StatusBadge'

interface Props {
  threats: Threat[]
  onSelect?: (threat: Threat) => void
  selected?: Threat | null
}

export default function ThreatTable({ threats, onSelect, selected }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-800/50">
            {['Threat ID', 'Event', 'Severity', 'User', 'Source IP', 'Time', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {threats.map(t => (
            <tr
              key={t.threat_id}
              onClick={() => onSelect?.(t)}
              className={`transition-colors ${onSelect ? 'cursor-pointer hover:bg-gray-800/50' : ''} ${selected?.threat_id === t.threat_id ? 'bg-blue-900/20' : ''}`}
            >
              <td className="px-4 py-3 text-blue-400 text-xs font-mono">{t.threat_id}</td>
              <td className="px-4 py-3 text-gray-300 text-sm">{t.event_type}</td>
              <td className="px-4 py-3"><SeverityBadge severity={t.severity} /></td>
              <td className="px-4 py-3 text-gray-400 text-sm">{t.username}</td>
              <td className="px-4 py-3 text-gray-400 text-sm font-mono">{t.source_ip}</td>
              <td className="px-4 py-3 text-gray-400 text-sm">
                {new Date(t.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
            </tr>
          ))}
          {threats.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                No threats found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}