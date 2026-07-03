import { useState } from 'react'

interface Threat {
  threat_id: string
  event_type: string
  severity: string
  risk_score: number
  source_ip: string
  username: string
  timestamp: string
  status: string
  description: string
  region: string
  resource_id?: string
  ai_analysis?: string
  recommendations?: string[]
}

interface Props { threat: Threat }

export default function AIAssistant({ threat }: Props) {
  const [open, setOpen] = useState(false)

  const scoreColor =
    threat.risk_score >= 90 ? '#f87171' :
    threat.risk_score >= 70 ? '#fb923c' :
    threat.risk_score >= 40 ? '#facc15' : '#60a5fa'

  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '8px',
            background: 'rgba(139,92,246,0.15)',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>🤖</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>
              AI Security Analysis
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
              Risk Score:
              <span style={{ color: scoreColor, fontWeight: 'bold', marginLeft: '4px' }}>
                {threat.risk_score}/100
              </span>
            </p>
          </div>
        </div>
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded Content */}
      {open && (
        <div style={{
          padding: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>

          {/* AI Analysis */}
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px' }}>
            <p style={{
              color: '#a78bfa',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px'
            }}>
              Analysis
            </p>
            <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              {threat.ai_analysis || 'No AI analysis available for this threat.'}
            </p>
          </div>

          {/* Risk Score Bar */}
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px' }}>
            <p style={{
              color: '#6b7280',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              margin: '0 0 8px'
            }}>
              Risk Level
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '8px', background: '#1f2937', borderRadius: '999px' }}>
                <div style={{
                  height: '8px',
                  borderRadius: '999px',
                  background: scoreColor,
                  width: `${threat.risk_score}%`,
                  transition: 'width 0.5s'
                }} />
              </div>
              <span style={{ color: scoreColor, fontWeight: 'bold', fontSize: '14px', minWidth: '48px' }}>
                {threat.risk_score}/100
              </span>
            </div>
          </div>

          {/* Recommendations */}
          {threat.recommendations && threat.recommendations.length > 0 && (
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px' }}>
              <p style={{
                color: '#fb923c',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 12px'
              }}>
                Recommended Actions
              </p>
              <ul style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {threat.recommendations.map((rec, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#d1d5db'
                  }}>
                    <span style={{ color: '#fb923c', marginTop: '2px', flexShrink: 0 }}>⚠</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  )
}