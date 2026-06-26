from fastapi import APIRouter, Depends, Query, HTTPException
from services.threat_service import ThreatService
from models.threat import ThreatCreate
from middleware.auth_middleware import get_current_user, require_role
from utils.logger import get_logger

router = APIRouter(prefix="/threats", tags=["Threats"])
logger = get_logger(__name__)
service = ThreatService()

@router.get("")
def list_threats(
    severity: str = Query(None),
    status:   str = Query(None),
    limit:    int = Query(50, le=200),
    current_user=Depends(get_current_user)
):
    return service.get_all_threats(severity=severity, status=status, limit=limit)

@router.get("/{threat_id}")
def get_threat(threat_id: str, current_user=Depends(get_current_user)):
    threat = service.get_threat(threat_id)
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    return threat

@router.post("", status_code=201)
def create_threat(
    body: ThreatCreate,
    current_user=Depends(require_role("security_analyst"))
):
    threat = service.create_threat(
        event_type=body.event_type,
        source_ip=body.source_ip,
        username=body.username,
        description=body.description,
        region=body.region,
        resource_id=body.resource_id
    )
    return threat

@router.patch("/{threat_id}/status")
def update_threat_status(
    threat_id: str,
    status: str = Query(...),
    current_user=Depends(require_role("security_analyst"))
):
    valid = ["OPEN", "ASSIGNED", "RESOLVED", "DISMISSED"]
    if status not in valid:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid}")
    ok = service.update_status(threat_id, status)
    if not ok:
        raise HTTPException(500, "Failed to update status")
    return {"message": f"Threat {threat_id} updated to {status}"}