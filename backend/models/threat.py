from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class SeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"

class StatusEnum(str, Enum):
    OPEN      = "OPEN"
    ASSIGNED  = "ASSIGNED"
    RESOLVED  = "RESOLVED"
    DISMISSED = "DISMISSED"

class ThreatCreate(BaseModel):
    event_type:  str
    source_ip:   str = "unknown"
    username:    str = "unknown"
    description: str = ""
    region:      str = "us-east-1"
    resource_id: Optional[str] = None

class ThreatResponse(BaseModel):
    threat_id:       str
    event_type:      str
    severity:        str
    risk_score:      int
    source_ip:       str
    username:        str
    timestamp:       str
    status:          str
    description:     str
    region:          str
    resource_id:     Optional[str]
    ai_analysis:     Optional[str]
    recommendations: Optional[List[str]]

class ThreatListResponse(BaseModel):
    total:    int
    items:    List[ThreatResponse]
    last_key: Optional[str] = None