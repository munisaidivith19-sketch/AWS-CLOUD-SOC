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

export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password })

export const getDashboard = () =>
  api.get('/dashboard')

export const getThreats = (params?: { severity?: string; status?: string; limit?: number }) =>
  api.get('/threats', { params })

export const getThreat = (id: string) =>
  api.get(`/threats/${id}`)

export const createThreat = (data: {
  event_type: string
  source_ip: string
  username: string
  description: string
}) => api.post('/threats', data)

export const updateThreatStatus = (id: string, status: string) =>
  api.patch(`/threats/${id}/status`, null, { params: { status } })

export const getIncidents = (params?: { status?: string }) =>
  api.get('/incidents', { params })

export const assignIncident = (id: string, assigned_to: string, notes: string) =>
  api.post(`/incidents/${id}/assign`, { assigned_to, notes })

export const resolveIncident = (id: string, resolution_notes: string, resolved_by: string) =>
  api.post(`/incidents/${id}/resolve`, { resolution_notes, resolved_by })

export const getAssets = () =>
  api.get('/assets')

export const seedAssets = () =>
  api.post('/assets/seed')

export const getSeverityDistribution = () =>
  api.get('/analytics/severity')

export const getTimeline = (days: number = 30) =>
  api.get('/analytics/timeline', { params: { days } })

export const getTopThreats = () =>
  api.get('/analytics/top-threats')

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary')