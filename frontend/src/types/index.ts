export interface Threat {
  threat_id: string
  event_type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  risk_score: number
  source_ip: string
  username: string
  timestamp: string
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'DISMISSED'
  description: string
  region: string
  resource_id?: string
  ai_analysis?: string
  recommendations?: string[]
}

export interface Incident {
  incident_id: string
  threat_id: string
  status: string
  severity?: string
  event_type?: string
  assigned_to?: string
  notes?: string
  resolution_notes?: string
  created_at: string
  updated_at?: string
  resolved_at?: string
}

export interface Asset {
  resource_id: string
  resource_type: string
  resource_name: string
  status: string
  region: string
  threat_count: number
  last_seen?: string
  tags?: Record<string, string>
}

export interface DashboardData {
  summary: {
    total_threats: number
    critical_threats: number
    high_threats: number
    open_incidents: number
    asset_count: number
  }
  severity_breakdown: Record<string, number>
  status_breakdown: Record<string, number>
  recent_threats: Threat[]
  timeline_7d: {
    labels: string[]
    data: number[]
  }
}

export interface User {
  username: string
  role: string
  full_name: string
  access_token: string
}