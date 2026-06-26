interface Props { severity: string }

const colors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH:     'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  MEDIUM:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  LOW:      'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

export default function SeverityBadge({ severity }: Props) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[severity] || colors.LOW}`}>
      {severity}
    </span>
  )
}