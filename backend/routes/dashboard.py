from fastapi import APIRouter, Depends
from services.threat_service import ThreatService
from services.incident_service import IncidentService
from services.analytics_service import AnalyticsService
from services.aws_inventory_service import AWSInventoryService
from middleware.auth_middleware import get_current_user
from utils.logger import get_logger

router        = APIRouter(prefix="/dashboard", tags=["Dashboard"])
threat_svc    = ThreatService()
incident_svc  = IncidentService()
analytics_svc = AnalyticsService()
aws_svc       = AWSInventoryService()
logger        = get_logger(__name__)

@router.get("")
def get_dashboard(current_user=Depends(get_current_user)):
    # Real threat counts from DynamoDB
    threat_counts = threat_svc.get_counts()

    # Real recent threats
    recent = threat_svc.get_all_threats(limit=10)

    # Real open incidents
    open_incidents = incident_svc.get_open_count()

    # Real AWS assets count
    try:
        assets = aws_svc.discover_all_assets()
        asset_count = len(assets)
    except Exception as e:
        logger.warning(f"Asset discovery failed: {e}")
        asset_count = 0

    # Real AWS service status
    try:
        aws_status = aws_svc.get_aws_service_status()
    except Exception as e:
        logger.warning(f"AWS status check failed: {e}")
        aws_status = {}

    # Real 7-day timeline
    timeline = analytics_svc.get_threats_timeline(days=7)

    return {
        "summary": {
            "total_threats":    threat_counts["total"],
            "critical_threats": threat_counts["by_severity"].get("CRITICAL", 0),
            "high_threats":     threat_counts["by_severity"].get("HIGH", 0),
            "open_incidents":   open_incidents,
            "asset_count":      asset_count,
        },
        "severity_breakdown": threat_counts["by_severity"],
        "status_breakdown":   threat_counts["by_status"],
        "recent_threats":     recent["items"],
        "timeline_7d":        timeline,
        "aws_status":         aws_status,
        "current_user": {
            "username": current_user.username,
            "role":     current_user.role
        }
    }