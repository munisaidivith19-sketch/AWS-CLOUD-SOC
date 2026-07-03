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
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        padding: '12px',
        borderRadius: '10px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>{title}</p>
        <p style={{ color: 'white', fontSize: '26px', fontWeight: 'bold', margin: '2px 0' }}>{value}</p>
        {subtitle && <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  )
}