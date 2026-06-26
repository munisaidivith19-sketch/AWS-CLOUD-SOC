from fastapi import APIRouter, Depends, Query, HTTPException
from services.incident_service import IncidentService
from models.incident import IncidentAssign, IncidentResolve
from middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/incidents", tags=["Incidents"])
service = IncidentService()

@router.get("")
def list_incidents(
    status: str = Query(None),
    limit:  int = Query(50),
    current_user=Depends(get_current_user)
):
    return service.get_all_incidents(status=status, limit=limit)

@router.get("/{incident_id}")
def get_incident(incident_id: str, current_user=Depends(get_current_user)):
    inc = service.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    return inc

@router.post("/{incident_id}/assign")
def assign_incident(
    incident_id: str,
    body: IncidentAssign,
    current_user=Depends(require_role("security_analyst"))
):
    ok = service.assign_incident(incident_id, body.assigned_to, body.notes or "")
    if not ok:
        raise HTTPException(500, "Failed to assign incident")
    return {"message": f"Incident {incident_id} assigned to {body.assigned_to}"}

@router.post("/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    body: IncidentResolve,
    current_user=Depends(require_role("security_analyst"))
):
    ok = service.resolve_incident(incident_id, body.resolution_notes, body.resolved_by)
    if not ok:
        raise HTTPException(500, "Failed to resolve incident")
    return {"message": f"Incident {incident_id} resolved"}