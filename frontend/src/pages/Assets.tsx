import { useEffect, useState } from 'react'
import { getAssets, seedAssets } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

interface Asset {
  resource_id: string
  resource_type: string
  resource_name: string
  status: string
  region: string
  threat_count: number
  last_seen?: string
  tags?: Record<string, string>
}

const typeEmoji: Record<string, string> = {
  IAM_USER: '👤', EC2: '🖥️', S3: '🪣',
  LAMBDA: '⚡', DYNAMODB: '🗄️', SNS: '📣',
}

export default function Assets() {
  const [assets, setAssets]   = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const { user } = useAuth()

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const res = await getAssets()
      setAssets(res.data.items || [])
    } finally { setLoading(false) }
  }

  const handleSeed = async () => {
    await seedAssets()
    fetchAssets()
  }

  useEffect(() => { fetchAssets() }, [])

  const types    = [...new Set(assets.map(a => a.resource_type))]
  const filtered = filter ? assets.filter(a => a.resource_type === filter) : assets

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Asset Inventory</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>{assets.length} monitored resources</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {user?.role === 'admin' && (
            <button onClick={handleSeed}
              style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
              🌱 Seed Assets
            </button>
          )}
          <button onClick={fetchAssets}
            style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer' }}>
            ↻
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('')}
          style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '13px', background: filter === '' ? '#2563eb' : '#1f2937', color: filter === '' ? 'white' : '#9ca3af' }}>
          All ({assets.length})
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '13px', background: filter === t ? '#2563eb' : '#1f2937', color: filter === t ? 'white' : '#9ca3af' }}>
            {typeEmoji[t] || '📦'} {t} ({assets.filter(a => a.resource_type === t).length})
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading assets...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(asset => (
            <div key={asset.resource_id}
              style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', fontSize: '18px' }}>
                  {typeEmoji[asset.resource_type] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.resource_name}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{asset.resource_type}</p>
                </div>
                <StatusBadge status={asset.status} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {[
                  ['Resource ID', asset.resource_id],
                  ['Region',      asset.region],
                  ['Threats',     String(asset.threat_count)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>{k}</span>
                    <span style={{
                      color: k === 'Threats' && Number(v) > 0 ? '#f87171' : '#9ca3af',
                      fontFamily: 'monospace',
                      fontWeight: k === 'Threats' && Number(v) > 0 ? 'bold' : 'normal'
                    }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#6b7280', background: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
              No assets found. Click "Seed Assets" to populate initial data.
            </div>
          )}
        </div>
      )}
    </div>
  )
}