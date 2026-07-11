import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('soc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────
export const login = (u: string, p: string) =>
  api.post('/auth/login', { username: u, password: p })

// ── Dashboard ─────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard')

// ── Threats ───────────────────────────────────────────────
export const getThreats = (params?: { severity?: string; status?: string; limit?: number }) =>
  api.get('/threats', { params })
export const getThreat          = (id: string)  => api.get(`/threats/${id}`)
export const createThreat       = (data: any)   => api.post('/threats', data)
export const updateThreatStatus = (id: string, status: string) =>
  api.patch(`/threats/${id}/status`, null, { params: { status } })

// ── Incidents ─────────────────────────────────────────────
export const getIncidents = (params?: { status?: string }) =>
  api.get('/incidents', { params })
export const getIncident    = (id: string) => api.get(`/incidents/${id}`)
export const assignIncident = (id: string, assigned_to: string, notes: string) =>
  api.post(`/incidents/${id}/assign`, { assigned_to, notes })
export const resolveIncident = (id: string, resolution_notes: string, resolved_by: string) =>
  api.post(`/incidents/${id}/resolve`, { resolution_notes, resolved_by })

// ── Assets ────────────────────────────────────────────────
export const getAssets    = () => api.get('/assets')
export const getAWSStatus = () => api.get('/assets/aws-status')
export const seedAssets   = () => api.post('/assets/seed')

// ── Analytics ─────────────────────────────────────────────
export const getSeverityDistribution = () => api.get('/analytics/severity')
export const getTimeline     = (days = 30) => api.get('/analytics/timeline', { params: { days } })
export const getTopThreats   = ()          => api.get('/analytics/top-threats')
export const getAnalyticsSummary = ()      => api.get('/analytics/summary')
export const getActiveUsers  = ()          => api.get('/analytics/active-users')
export const getTopIPs       = ()          => api.get('/analytics/top-ips')
export const getRiskTrend    = ()          => api.get('/analytics/risk-trend')
export const getIncidentTrend = ()         => api.get('/analytics/incident-trend')
export const getAuditLogStats = ()         => api.get('/analytics/audit-logs')

// ── Live Events ───────────────────────────────────────────
export const getLiveEvents    = (limit = 100) => api.get('/live/events', { params: { limit } })
export const getLoginActivity = ()            => api.get('/live/login-activity')
export const getAttackChains  = ()            => api.get('/live/attack-chains')
export const pollUpdates      = ()            => api.get('/live/poll')
export const getAuditLogs     = (limit = 100) => api.get('/live/audit-logs', { params: { limit } })

// ── AI Investigation ──────────────────────────────────────
export const investigateThreat   = (id: string) => api.get(`/ai/investigate/threat/${id}`)
export const investigateIncident = (id: string) => api.get(`/ai/investigate/incident/${id}`)
export const getAISummary        = ()            => api.get('/ai/summary')