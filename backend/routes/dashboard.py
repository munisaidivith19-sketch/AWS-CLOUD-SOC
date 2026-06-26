from fastapi import APIRouter, Depends
from services.threat_service import ThreatService
from services.incident_service import IncidentService
from services.asset_service import AssetService
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
threat_svc   = ThreatService()
incident_svc = IncidentService()
asset_svc    = AssetService()
analytics_svc = AnalyticsService()

@router.get("")
def get_dashboard(current_user=Depends(get_current_user)):
    threat_counts = threat_svc.get_counts()
    recent        = threat_svc.get_all_threats(limit=10)
    open_incidents = incident_svc.get_open_count()
    asset_count   = asset_svc.get_asset_count()
    timeline      = analytics_svc.get_threats_timeline(days=7)

    return {
        "summary": {
            "total_threats":    threat_counts["total"],
            "critical_threats": threat_counts["by_severity"]["CRITICAL"],
            "high_threats":     threat_counts["by_severity"]["HIGH"],
            "open_incidents":   open_incidents,
            "asset_count":      asset_count,
        },
        "severity_breakdown": threat_counts["by_severity"],
        "status_breakdown":   threat_counts["by_status"],
        "recent_threats":     recent["items"],
        "timeline_7d":        timeline,
        "current_user": {
            "username": current_user.username,
            "role":     current_user.role
        }
    }