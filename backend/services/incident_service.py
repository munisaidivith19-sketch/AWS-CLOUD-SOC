import uuid
from datetime import datetime, timezone
from typing import Optional
from boto3.dynamodb.conditions import Attr
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger
import os

logger = get_logger(__name__)

class IncidentService:
    def __init__(self):
        self.db = DynamoDBClient(os.getenv("INCIDENTS_TABLE", "soc_incidents"))

    def create_incident_from_threat(self, threat: dict) -> dict:
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "incident_id":      incident_id,
            "threat_id":        threat.get("threat_id"),
            "status":           "OPEN",
            "severity":         threat.get("severity"),
            "event_type":       threat.get("event_type"),
            "assigned_to":      None,
            "notes":            "",
            "resolution_notes": "",
            "created_at":       now,
            "updated_at":       now,
            "resolved_at":      None,
        }
        self.db.put_item(item)
        logger.info(f"Incident created: {incident_id} from {threat.get('threat_id')}")
        return item

    def get_all_incidents(self, status: str = None, limit: int = 50) -> dict:
        f = Attr("status").eq(status) if status else None
        result = self.db.scan_items(filter_expression=f, limit=limit)
        items  = sorted(result["items"], key=lambda x: x.get("created_at", ""), reverse=True)
        return {"total": len(items), "items": items}

    def get_incident(self, incident_id: str) -> Optional[dict]:
        return self.db.get_item({"incident_id": incident_id})

    def assign_incident(self, incident_id: str,
                        assigned_to: str, notes: str = "") -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"incident_id": incident_id},
            update_expr="SET #st = :s, assigned_to = :a, notes = :n, updated_at = :u",
            expr_values={
                ":s": "ASSIGNED",
                ":a": assigned_to,
                ":n": notes,
                ":u": now
            },
            expr_names={"#st": "status"}
        )

    def resolve_incident(self, incident_id: str,
                         resolution_notes: str, resolved_by: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"incident_id": incident_id},
            update_expr=(
                "SET #st = :s, resolution_notes = :r, "
                "resolved_by = :rb, resolved_at = :ra, updated_at = :u"
            ),
            expr_values={
                ":s":  "RESOLVED",
                ":r":  resolution_notes,
                ":rb": resolved_by,
                ":ra": now,
                ":u":  now
            },
            expr_names={"#st": "status"}
        )

    def get_open_count(self) -> int:
        result = self.db.scan_items(
            filter_expression=Attr("status").ne("RESOLVED"),
            limit=500
        )
        return len(result["items"])