from fastapi import APIRouter, Depends, Query
from services.live_events_service import LiveEventsService
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import get_current_user
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger
import os

router    = APIRouter(prefix="/live", tags=["Live Events"])
service   = LiveEventsService()
analytics = AnalyticsService()
logger    = get_logger(__name__)


@router.get("/events")
def get_live_events(
    limit: int = Query(100, le=500),
    current_user=Depends(get_current_user)
):
    return service.get_recent_events(limit=limit)


@router.get("/login-activity")
def get_login_activity(current_user=Depends(get_current_user)):
    return service.get_login_activity()


@router.get("/attack-chains")
def get_attack_chains(current_user=Depends(get_current_user)):
    return service.get_attack_chains()


@router.get("/poll")
def poll_updates(current_user=Depends(get_current_user)):
    """
    Single endpoint called every 15 seconds by frontend.
    Returns everything needed for live dashboard update.
    """
    try:
        stream   = service.get_stream_data()
        login    = service.get_login_activity()
        chains   = service.get_attack_chains()
        audit_s  = analytics.get_audit_log_stats() if hasattr(analytics, 'get_audit_log_stats') else {}
        return {
            **stream,
            "login_activity": login,
            "attack_chains":  chains.get("chains", []),
            "audit_stats":    audit_s,
        }
    except Exception as e:
        logger.error(f"poll_updates error: {e}")
        return {
            "type":             "update",
            "total_threats":    0,
            "critical_count":   0,
            "open_count":       0,
            "recent_threats":   [],
            "severity_counts":  {},
            "status_counts":    {},
            "login_activity":   {},
            "attack_chains":    [],
            "audit_stats":      {},
        }


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(100, le=500),
    current_user=Depends(get_current_user)
):
    db     = DynamoDBClient(os.getenv("AUDIT_LOGS_TABLE", "soc_audit_logs"))
    result = db.scan_items(limit=limit)
    items  = sorted(result["items"], key=lambda x: x.get("timestamp",""), reverse=True)
    return {"total": len(items), "logs": items}