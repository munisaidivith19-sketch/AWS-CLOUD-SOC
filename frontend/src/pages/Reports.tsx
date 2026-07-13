import { useEffect, useState } from 'react'
import axios from 'axios'

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

const REPORT_TYPES = [
  'daily', 'weekly', 'monthly', 'threat',
  'incident', 'executive', 'asset', 'audit_log', 'ai_investigation', 'custom'
]

const FORMATS = [
  { value: 'pdf',  label: '📄 PDF',      color: '#ff4d6d' },
  { value: 'docx', label: '📝 Word',     color: '#4cc9f0' },
  { value: 'txt',  label: '📋 TXT',      color: '#ffd166' },
  { value: 'md',   label: '🔷 Markdown', color: '#06d6a0' },
]

const SEVERITIES = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const STATUSES   = ['', 'OPEN', 'ASSIGNED', 'RESOLVED', 'DISMISSED']

export default function Reports() {
  const [filters, setFilters] = useState({
    report_type:    'custom',
    format:         'pdf',
    date_from:      '',
    date_to:        '',
    severity:       '',
    status:         '',
    region:         '',
    username:       '',
    source_ip:      '',
    min_risk_score: 0,
  })
  const [preview, setPreview]     = useState<any>(null)
  const [history, setHistory]     = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [_loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  const token = localStorage.getItem('soc_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/v1/reports/history', { headers })
      setHistory(res.data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const params: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await axios.get('/api/v1/reports/preview', { headers, params })
      setPreview(res.data)
    } catch (e) { console.error(e) }
    finally { setPreviewing(false) }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const body: any = { ...filters }
      Object.keys(body).forEach(k => { if (!body[k] && body[k] !== 0) delete body[k] })

      const res = await axios.post('/api/v1/reports/generate', body, {
        headers,
        responseType: 'blob',
      })

      const ext   = filters.format
      const now   = new Date().toISOString().slice(0,19).replace(/:/g,'-')
      const fname = `soc_report_${filters.report_type}_${now}.${ext}`
      const url   = window.URL.createObjectURL(new Blob([res.data]))
      const a     = document.createElement('a')
      a.href      = url
      a.download  = fname
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      await fetchHistory()
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const handleDelete = async (report_id: string) => {
    try {
      await axios.delete(`/api/v1/reports/${report_id}`, { headers })
      await fetchHistory()
    } catch (e) { console.error(e) }
  }

  const F = (label: string, key: string, type = 'text', options?: string[]) => (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </label>
      {options ? (
        <select
          value={(filters as any)[key]}
          onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }}
        >
          {options.map(o => <option key={o} value={o}>{o || 'All'}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(filters as any)[key]}
          onChange={e => setFilters(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }}
        />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ ...glass, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: 0 }}>AI Report Generator</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
            Generate professional SOC reports from live AWS data · PDF · DOCX · TXT · Markdown
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['generate','history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: activeTab === tab ? '#2563eb' : 'rgba(255,255,255,0.06)', color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {tab === 'generate' ? '⚙️ Generate' : `📚 History (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>

          {/* Filters Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Export Format */}
            <div style={{ ...glass, padding: '20px' }}>
              <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>EXPORT FORMAT</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {FORMATS.map(fmt => (
                  <button key={fmt.value} onClick={() => setFilters(p => ({ ...p, format: fmt.value }))}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${filters.format === fmt.value ? fmt.color : 'rgba(255,255,255,0.08)'}`, background: filters.format === fmt.value ? `${fmt.color}18` : 'rgba(255,255,255,0.02)', color: filters.format === fmt.value ? fmt.color : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}>
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Type + Filters */}
            <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: 0, letterSpacing: '0.05em' }}>REPORT FILTERS</h2>
              {F('Report Type', 'report_type', 'text', REPORT_TYPES)}
              {F('Date From',   'date_from',   'date')}
              {F('Date To',     'date_to',     'date')}
              {F('Severity',    'severity',    'text', SEVERITIES)}
              {F('Status',      'status',      'text', STATUSES)}
              {F('Region',      'region')}
              {F('Username',    'username')}
              {F('Source IP',   'source_ip')}
              {F('Min Risk Score', 'min_risk_score', 'number')}
            </div>

            {/* Buttons */}
            <button onClick={handlePreview} disabled={previewing}
              style={{ padding: '12px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.3)', borderRadius: '12px', color: '#4cc9f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {previewing ? '⏳ Loading preview...' : '👁 Preview Report Data'}
            </button>

            <button onClick={handleGenerate} disabled={generating}
              style={{ padding: '14px', background: generating ? 'rgba(37,99,235,0.5)' : '#2563eb', border: 'none', borderRadius: '12px', color: 'white', cursor: generating ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {generating ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Generating...
                </>
              ) : (
                `⬇ Download ${FORMATS.find(f => f.value === filters.format)?.label || 'Report'}`
              )}
            </button>
          </div>

          {/* Preview Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!preview && (
              <div style={{ ...glass, padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                  Click "Preview Report Data" to see what will be included in your report
                </p>
              </div>
            )}

            {preview && (
              <>
                {/* AI Summary */}
                <div style={{ ...glass, padding: '20px', borderColor: 'rgba(76,201,240,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ color: '#4cc9f0', fontSize: '13px', fontWeight: '700', margin: 0 }}>🤖 AI SECURITY ASSESSMENT</h2>
                    <div style={{ padding: '4px 12px', background: `${preview.ai_summary?.risk_level === 'CRITICAL' ? 'rgba(255,77,109,0.15)' : preview.ai_summary?.risk_level === 'HIGH' ? 'rgba(255,140,66,0.15)' : 'rgba(6,214,160,0.15)'}`, border: `1px solid ${preview.ai_summary?.risk_level === 'CRITICAL' ? 'rgba(255,77,109,0.3)' : 'rgba(6,214,160,0.3)'}`, borderRadius: '6px' }}>
                      <span style={{ color: preview.ai_summary?.risk_level === 'CRITICAL' ? '#ff4d6d' : '#06d6a0', fontSize: '11px', fontWeight: '700' }}>
                        {preview.ai_summary?.risk_level} RISK · Score: {preview.ai_summary?.security_score}/100
                      </span>
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                    {preview.ai_summary?.executive_summary}
                  </p>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Total Threats',    value: preview.analytics?.total_threats,    color: '#4cc9f0' },
                    { label: 'Critical',         value: preview.analytics?.severity_breakdown?.CRITICAL ?? 0, color: '#ff4d6d' },
                    { label: 'Open Incidents',   value: preview.analytics?.open_incidents,   color: '#ff8c42' },
                    { label: 'Assets',           value: preview.assets?.length ?? 0,         color: '#06d6a0' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ ...glass, padding: '14px', borderColor: `${color}22`, textAlign: 'center' }}>
                      <p style={{ color, fontSize: '22px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{value}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '4px 0 0' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations preview */}
                <div style={{ ...glass, padding: '20px' }}>
                  <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: '0 0 12px' }}>RECOMMENDATIONS PREVIEW</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(preview.ai_summary?.recommendations || []).slice(0,5).map((rec: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <span style={{ color: '#ffd166', flexShrink: 0 }}>{i+1}.</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Threat preview table */}
                <div style={{ ...glass, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                      THREAT DATA PREVIEW ({preview.threats?.length || 0} records)
                    </h2>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {['Threat ID','Event','Severity','User','Source IP','Time'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(preview.threats || []).slice(0,10).map((t: any) => (
                        <tr key={t.threat_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 12px', color: '#4cc9f0', fontSize: '10px', fontFamily: 'monospace' }}>{t.threat_id}</td>
                          <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{t.event_type}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', color: t.severity === 'CRITICAL' ? '#ff4d6d' : t.severity === 'HIGH' ? '#ff8c42' : t.severity === 'MEDIUM' ? '#ffd166' : '#06d6a0', background: t.severity === 'CRITICAL' ? 'rgba(255,77,109,0.15)' : 'rgba(6,214,160,0.1)' }}>
                              {t.severity}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t.username}</td>
                          <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'monospace' }}>{t.source_ip}</td>
                          <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace' }}>{t.timestamp?.slice(0,16)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ ...glass, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: 0 }}>Report History</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Report ID','Name','Generated By','Generated At','Type','Format','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(r => (
                <tr key={r.report_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 14px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace' }}>{r.report_id}</td>
                  <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{r.name}</td>
                  <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.generated_by}</td>
                  <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: 'monospace' }}>{r.generated_at?.slice(0,16)}</td>
                  <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{r.report_type}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(76,201,240,0.1)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: '4px', color: '#4cc9f0', fontSize: '10px', fontWeight: '600' }}>
                      {r.format?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => handleDelete(r.report_id)}
                      style={{ padding: '4px 10px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: '6px', color: '#ff4d6d', cursor: 'pointer', fontSize: '11px' }}>
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  No reports generated yet
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}