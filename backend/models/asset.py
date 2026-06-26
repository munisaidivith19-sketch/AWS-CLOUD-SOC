from pydantic import BaseModel
from typing import Optional, List

class AssetResponse(BaseModel):
    resource_id:   str
    resource_type: str
    resource_name: str
    status:        str
    region:        str
    threat_count:  int = 0
    last_seen:     Optional[str]
    tags:          Optional[dict]

class AssetListResponse(BaseModel):
    total: int
    items: List[AssetResponse]