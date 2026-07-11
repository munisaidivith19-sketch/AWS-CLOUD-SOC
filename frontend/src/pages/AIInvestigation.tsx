import { useEffect, useState } from 'react'
import { getThreats, getAISummary, investigateThreat, getAttackChains } from '../services/api'

const glass: React.CSSProperties = {
  background:           'rgba(255,255,255,0.03)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.08)',
  borderRadius:         '16px',
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d6d', HIGH: '#ff8c42', MEDIUM: '#ffd166', LOW: '#06d6a0'
}

export default function AIInvestigation() {
  const [summary, setSummary]       = useState<any>(null)
  const [threats, setThreats]       = useState<any[]>([])
  const [chains, setChains]         = useState<any[]>([])
  const [selected, setSelected]     = useState<any>(null)
  const [report, setReport]         = useState<any>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sumRes, threatRes, chainRes] = await Promise.all([
          getAISummary(),
          getThreats({ limit: 50 }),
          getAttackChains(),
        ])
        setSummary(sumRes.data)
        setThreats(threatRes.data.items || [])
        setChains(chainRes.data.chains || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleInvestigate = async (threat: any) => {
    setSelected(threat)
    setReport(null)
    setLoadingReport(true)
    try {
      const res = await investigateThreat(threat.threat_id)
      setReport(res.data)
    } catch (e) { console.error(e) }
    finally { setLoadingReport(false) }
  }

  const riskColor = summary?.risk_level === 'CRITICAL' ? '#ff4d6d' :
                    summary?.risk_level === 'HIGH'     ? '#ff8c42' :
                    summary?.risk_level === 'MEDIUM'   ? '#ffd166' : '#06d6a0'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: '#4cc9f0', letterSpacing: '0.1em' }}>LOADING AI INVESTIGATION...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes pulse-glow{0%,100%{opacity:.6}50%{opacity:1}}`}</style>

      {/* Header */}
      <div style={{ ...glass, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: 0 }}>AI Security Investigation</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
            AI-powered threat analysis · MITRE ATT&CK mapping · Attack chain detection
          </p>
        </div>
        <div style={{ padding: '8px 16px', background: `${riskColor}12`, border: `1px solid ${riskColor}30`, borderRadius: '10px' }}>
          <span style={{ color: riskColor, fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em' }}>
            RISK: {summary?.risk_level || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* AI Posture Summary */}
      {summary && (
        <div style={{ ...glass, padding: '20px', borderColor: `${riskColor}25` }}>
          <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '0.05em' }}>
            🤖 AI SECURITY POSTURE SUMMARY
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.7' }}>
            {summary.summary}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total Threats',  value: summary.total_threats,    color: '#4cc9f0' },
              { label: 'Critical',       value: summary.critical_count,   color: '#ff4d6d' },
              { label: 'Attack Chains',  value: summary.attack_chains,    color: '#ff8c42' },
              { label: 'Active Users',   value: summary.active_users_24h, color: '#06d6a0' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '10px' }}>
                <p style={{ color, fontSize: '24px', fontWeight: '800', margin: 0, fontFamily: 'monospace' }}>{value}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 8px' }}>RECOMMENDED ACTIONS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(summary.recommendations || []).map((rec: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: '#ffd166', marginTop: '1px', flexShrink: 0 }}>→</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attack Chains */}
      {chains.length > 0 && (
        <div style={{ ...glass, padding: '20px', borderColor: 'rgba(255,77,109,0.25)' }}>
          <h2 style={{ color: '#ff4d6d', fontSize: '14px', fontWeight: '700', margin: '0 0 14px' }}>
            🔗 ATTACK CHAINS ({chains.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chains.map(chain => (
              <div key={chain.chain_id} style={{ padding: '14px', background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#ff4d6d', fontWeight: '700', fontSize: '13px' }}>{chain.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace' }}>{chain.mitre}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: '0 0 10px', lineHeight: '1.5' }}>{chain.description}</p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {chain.events?.map((ev: string, i: number, arr: string[]) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ padding: '2px 8px', background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: '4px', color: '#ff4d6d', fontSize: '10px', fontFamily: 'monospace' }}>{ev}</span>
                      {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Investigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Threat List */}
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>
            SELECT THREAT TO INVESTIGATE
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {threats.map(threat => (
              <div
                key={threat.threat_id}
                onClick={() => handleInvestigate(threat)}
                style={{
                  padding: '12px 14px',
                  background: selected?.threat_id === threat.threat_id ? 'rgba(76,201,240,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected?.threat_id === threat.threat_id ? 'rgba(76,201,240,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace', fontWeight: '600' }}>{threat.threat_id}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', background: `${SEV_COLOR[threat.severity]}18`, color: SEV_COLOR[threat.severity] }}>
                    {threat.severity}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 2px' }}>{threat.event_type}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: 'monospace' }}>
                  {threat.username} · {new Date(threat.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
            {threats.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px' }}>No threats to investigate</p>
            )}
          </div>
        </div>

        {/* Investigation Report */}
        <div style={{ ...glass, padding: '20px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '0.05em' }}>
            AI INVESTIGATION REPORT
          </h2>

          {!selected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '13px' }}>
                ← Select a threat to generate<br/>AI investigation report
              </p>
            </div>
          )}

          {loadingReport && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: '#4cc9f0', letterSpacing: '0.1em', fontSize: '12px' }}>GENERATING AI REPORT...</p>
            </div>
          )}

          {report && !loadingReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '500px', overflowY: 'auto' }}>

              {/* Executive Summary */}
              <div style={{ padding: '14px', background: 'rgba(76,201,240,0.05)', border: '1px solid rgba(76,201,240,0.15)', borderRadius: '10px' }}>
                <p style={{ color: '#4cc9f0', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 6px' }}>EXECUTIVE SUMMARY</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{report.executive_summary}</p>
              </div>

              {/* MITRE ATT&CK */}
              {report.ai_analysis?.mitre_technique && (
                <div style={{ padding: '14px', background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.15)', borderRadius: '10px' }}>
                  <p style={{ color: '#ff4d6d', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 8px' }}>MITRE ATT&CK</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(255,77,109,0.15)', borderRadius: '6px', color: '#ff4d6d', fontSize: '11px', fontWeight: '600' }}>
                      {report.ai_analysis.mitre_technique}
                    </span>
                    <span style={{ padding: '4px 10px', background: 'rgba(255,140,66,0.1)', borderRadius: '6px', color: '#ff8c42', fontSize: '11px' }}>
                      {report.ai_analysis.mitre_tactic}
                    </span>
                    <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                      {report.ai_analysis.mitre_name}
                    </span>
                  </div>
                </div>
              )}

              {/* Business Impact */}
              {report.ai_analysis?.business_impact && (
                <div style={{ padding: '14px', background: 'rgba(255,209,102,0.05)', border: '1px solid rgba(255,209,102,0.15)', borderRadius: '10px' }}>
                  <p style={{ color: '#ffd166', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 6px' }}>BUSINESS IMPACT</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{report.ai_analysis.business_impact}</p>
                </div>
              )}

              {/* AI Analysis Detail */}
              {report.ai_analysis?.ai_analysis && (
                <div style={{ padding: '14px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px' }}>
                  <p style={{ color: '#a78bfa', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 6px' }}>🤖 DETAILED ANALYSIS</p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>{report.ai_analysis.ai_analysis}</p>
                </div>
              )}

              {/* Confidence */}
              {report.ai_analysis?.confidence_score && (
                <div style={{ padding: '12px 14px', background: 'rgba(6,214,160,0.05)', border: '1px solid rgba(6,214,160,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>AI Confidence Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
                      <div style={{ height: '4px', width: `${report.ai_analysis.confidence_score}%`, background: '#06d6a0', borderRadius: '999px' }} />
                    </div>
                    <span style={{ color: '#06d6a0', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}>{report.ai_analysis.confidence_score}%</span>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.ai_analysis?.recommendations?.length > 0 && (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 10px' }}>RECOMMENDED ACTIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {report.ai_analysis.recommendations.map((rec: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#ffd166', marginTop: '1px', flexShrink: 0, fontSize: '11px' }}>{i+1}.</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: '1.5' }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CIS References */}
              {report.cis_references?.length > 0 && (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 8px' }}>CIS BENCHMARK REFERENCES</p>
                  {report.cis_references.map((ref: string, i: number) => (
                    <p key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>• {ref}</p>
                  ))}
                </div>
              )}

              {/* AWS Best Practices */}
              {report.aws_best_practices?.length > 0 && (
                <div style={{ padding: '14px', background: 'rgba(76,201,240,0.03)', border: '1px solid rgba(76,201,240,0.1)', borderRadius: '10px' }}>
                  <p style={{ color: '#4cc9f0', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', margin: '0 0 8px' }}>AWS BEST PRACTICES</p>
                  {report.aws_best_practices.map((p: string, i: number) => (
                    <p key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>• {p}</p>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}