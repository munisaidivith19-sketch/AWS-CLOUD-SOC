import { useEffect, useState } from 'react'
import { Monitor, RefreshCw, Database, Cloud, Shield, Server } from 'lucide-react'
import { getAssets, seedAssets } from '../services/api'
import { Asset } from '../types'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const typeIcons: Record<string, any> = {
  IAM_USER: Shield,
  EC2:      Server,
  S3:       Cloud,
  LAMBDA:   Database,
  DYNAMODB: Database,
  SNS:      Cloud,
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
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    await seedAssets()
    fetchAssets()
  }

  useEffect(() => { fetchAssets() }, [])

  const filtered = filter
    ? assets.filter(a => a.resource_type === filter)
    : assets

  const types = [...new Set(assets.map(a => a.resource_type))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Asset Inventory</h1>
          <p className="text-gray-400 text-sm">{assets.length} monitored resources</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && assets.length === 0 && (
            <button
              onClick={handleSeed}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              Seed Assets
            </button>
          )}
          <button onClick={fetchAssets} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter by type */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === '' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          All ({assets.length})
        </button>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {t} ({assets.filter(a => a.resource_type === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => {
            const Icon = typeIcons[asset.resource_type] || Monitor
            return (
              <div key={asset.resource_id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{asset.resource_name}</p>
                    <p className="text-gray-500 text-xs">{asset.resource_type}</p>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resource ID</span>
                    <span className="text-gray-400 font-mono">{asset.resource_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Region</span>
                    <span className="text-gray-400">{asset.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Threat Count</span>
                    <span className={asset.threat_count > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                      {asset.threat_count}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <Monitor className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No assets found. Click "Seed Assets" to populate.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}