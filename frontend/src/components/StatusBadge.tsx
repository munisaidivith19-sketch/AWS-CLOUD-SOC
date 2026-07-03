interface Props { status: string }

const styles: Record<string, { bg: string; color: string }> = {
  OPEN:        { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  ASSIGNED:    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  IN_PROGRESS: { bg: 'rgba(234,179,8,0.15)',   color: '#facc15' },
  RESOLVED:    { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  DISMISSED:   { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  ACTIVE:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  RUNNING:     { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
}

export default function StatusBadge({ status }: Props) {
  const s = styles[status] || styles.DISMISSED
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 'bold',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}44`
    }}>
      {status}
    </span>
  )
}