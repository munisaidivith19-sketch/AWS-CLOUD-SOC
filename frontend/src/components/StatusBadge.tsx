interface Props { status: string }

const colors: Record<string, string> = {
  OPEN:        'bg-red-500/20 text-red-400 border border-red-500/30',
  ASSIGNED:    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  RESOLVED:    'bg-green-500/20 text-green-400 border border-green-500/30',
  DISMISSED:   'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  ACTIVE:      'bg-green-500/20 text-green-400 border border-green-500/30',
  RUNNING:     'bg-green-500/20 text-green-400 border border-green-500/30',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
      {status}
    </span>
  )
}