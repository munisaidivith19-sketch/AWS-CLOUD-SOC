import { ReactNode } from 'react'

interface Props {
  title: string
  value: number | string
  icon: ReactNode
  color: string
  subtitle?: string
}

export default function StatCard({ title, value, icon, color, subtitle }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-4 hover:border-gray-700 transition-all">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}