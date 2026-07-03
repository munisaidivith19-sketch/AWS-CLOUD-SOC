interface Props { severity: string }

const colors: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.15)',
  HIGH:     'rgba(249,115,22,0.15)',
  MEDIUM:   'rgba(234,179,8,0.15)',
  LOW:      'rgba(59,130,246,0.15)',
}
const textColors: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH:     '#fb923c',
  MEDIUM:   '#facc15',
  LOW:      '#60a5fa',
}

export default function SeverityBadge({ severity }: Props) {
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 'bold',
      background: colors[severity] || colors.LOW,
      color: textColors[severity] || textColors.LOW,
      border: `1px solid ${textColors[severity] || textColors.LOW}44`
    }}>
      {severity}
    </span>
  )
}