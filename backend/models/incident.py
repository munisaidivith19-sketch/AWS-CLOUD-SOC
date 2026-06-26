from pydantic import BaseModel
from typing import Optional, List

class IncidentStatus(str):
    OPEN       = "OPEN"
    ASSIGNED   = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED   = "RESOLVED"
    CLOSED     = "CLOSED"

class IncidentAssign(BaseModel):
    assigned_to: str
    notes:       Optional[str] = ""

class IncidentResolve(BaseModel):
    resolution_notes: str
    resolved_by:      str

class IncidentResponse(BaseModel):
    incident_id:      str
    threat_id:        str
    status:           str
    assigned_to:      Optional[str]
    notes:            Optional[str]
    resolution_notes: Optional[str]
    created_at:       str
    updated_at:       Optional[str]
    resolved_at:      Optional[str]
    severity:         Optional[str]
    event_type:       Optional[str]

class IncidentListResponse(BaseModel):
    total: int
    items: List[IncidentResponse]