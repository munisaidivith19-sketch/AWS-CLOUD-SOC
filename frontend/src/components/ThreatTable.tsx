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
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1f2937', background: 'rgba(31,41,55,0.5)' }}>
            {['Threat ID','Event','Severity','User','Source IP','Time','Status'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {threats.map((t, i) => (
            <tr
              key={t.threat_id}
              onClick={() => onSelect?.(t)}
              style={{
                borderBottom: '1px solid #1f2937',
                cursor: onSelect ? 'pointer' : 'default',
                background: selected?.threat_id === t.threat_id
                  ? 'rgba(37,99,235,0.1)'
                  : i % 2 === 0 ? 'transparent' : 'rgba(17,24,39,0.3)'
              }}
            >
              <td style={{ padding: '12px 16px', color: '#60a5fa', fontSize: '12px', fontFamily: 'monospace' }}>{t.threat_id}</td>
              <td style={{ padding: '12px 16px', color: '#d1d5db', fontSize: '13px' }}>{t.event_type}</td>
              <td style={{ padding: '12px 16px' }}><SeverityBadge severity={t.severity} /></td>
              <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{t.username}</td>
              <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace' }}>{t.source_ip}</td>
              <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>{new Date(t.timestamp).toLocaleString()}</td>
              <td style={{ padding: '12px 16px' }}><StatusBadge status={t.status} /></td>
            </tr>
          ))}
          {threats.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                No threats found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}