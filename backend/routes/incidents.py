from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.incident_service import IncidentService
from middleware.auth_middleware import get_current_user, require_role
from utils.logger import get_logger

router  = APIRouter(prefix="/incidents", tags=["Incidents"])
service = IncidentService()
logger  = get_logger(__name__)


class AssignRequest(BaseModel):
    assigned_to: str
    notes:       Optional[str] = ""


class ResolveRequest(BaseModel):
    resolution_notes: str
    resolved_by:      str


class StatusRequest(BaseModel):
    status: str
    notes:  Optional[str] = ""


@router.get("")
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit:  int = Query(100),
    current_user=Depends(get_current_user)
):
    return service.get_all_incidents(status=status, severity=severity, limit=limit)

@router.get("/{incident_id}")
def get_incident(incident_id: str, current_user=Depends(get_current_user)):
    inc = service.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    return inc

@router.post("/{incident_id}/assign")
def assign_incident(
    incident_id: str,
    body: AssignRequest,
    current_user=Depends(require_role("soc_analyst"))
):
    ok = service.assign_incident(incident_id, body.assigned_to, body.notes or "")
    if not ok:
        raise HTTPException(500, "Failed to assign")
    return {"message": f"Incident {incident_id} assigned to {body.assigned_to}"}

@router.post("/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    body: ResolveRequest,
    current_user=Depends(require_role("soc_analyst"))
):
    ok = service.resolve_incident(incident_id, body.resolution_notes, body.resolved_by)
    if not ok:
        raise HTTPException(500, "Failed to resolve")
    return {"message": f"Incident {incident_id} resolved"}

@router.patch("/{incident_id}/status")
def update_status(
    incident_id: str,
    body: StatusRequest,
    current_user=Depends(require_role("soc_analyst"))
):
    valid = ["OPEN","ASSIGNED","IN_PROGRESS","RESOLVED","FALSE_POSITIVE","CLOSED"]
    if body.status not in valid:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid}")
    ok = service.update_status(incident_id, body.status)
    if not ok:
        raise HTTPException(500, "Failed to update status")
    return {"message": f"Incident {incident_id} → {body.status}"}

@router.post("/{incident_id}/reopen")
def reopen_incident(
    incident_id: str,
    current_user=Depends(require_role("soc_analyst"))
):
    ok = service.update_status(incident_id, "OPEN")
    if not ok:
        raise HTTPException(500, "Failed to reopen")
    return {"message": f"Incident {incident_id} reopened"}

@router.post("/{incident_id}/false-positive")
def mark_false_positive(
    incident_id: str,
    current_user=Depends(require_role("soc_analyst"))
):
    ok = service.update_status(incident_id, "FALSE_POSITIVE")
    if not ok:
        raise HTTPException(500, "Failed to mark false positive")
    return {"message": f"Incident {incident_id} marked as false positive"}