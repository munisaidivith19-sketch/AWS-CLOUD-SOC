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
            "threat_id":        threat.get("threat_id", ""),
            "status":           "OPEN",
            "severity":         threat.get("severity", "LOW"),
            "event_type":       threat.get("event_type", ""),
            "raw_event_name":   threat.get("raw_event_name", ""),
            "assigned_to":      None,
            "notes":            "",
            "investigation_notes": "",
            "resolution_notes": "",
            "created_at":       now,
            "updated_at":       now,
            "resolved_at":      None,
            "username":         threat.get("username", ""),
            "source_ip":        threat.get("source_ip", ""),
            "region":           threat.get("region", ""),
            "resource_id":      threat.get("resource_id", ""),
            "mitre":            threat.get("mitre", ""),
            "ai_analysis":      threat.get("ai_analysis", ""),
            "description":      threat.get("description", ""),
            "risk_score":       threat.get("risk_score", 0),
            "account_id":       threat.get("account_id", ""),
        }
        ok = self.db.put_item(item)
        if ok:
            logger.info(f"Incident created: {incident_id} from {threat.get('threat_id')}")
        else:
            logger.error(f"Failed to create incident from {threat.get('threat_id')}")
        return item

    def get_all_incidents(self, status: str = None, severity: str = None, limit: int = 100) -> dict:
        filters = []
        if status:
            filters.append(Attr("status").eq(status))
        if severity:
            filters.append(Attr("severity").eq(severity))
        combined = None
        for f in filters:
            combined = f if combined is None else combined & f
        result = self.db.scan_items(filter_expression=combined, limit=limit)
        items  = sorted(result["items"], key=lambda x: x.get("created_at",""), reverse=True)
        return {"total": len(items), "items": items}

    def get_incident(self, incident_id: str) -> Optional[dict]:
        return self.db.get_item({"incident_id": incident_id})

    def assign_incident(self, incident_id: str, assigned_to: str, notes: str = "") -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"incident_id": incident_id},
            update_expr="SET #st = :s, assigned_to = :a, notes = :n, updated_at = :u",
            expr_values={":s": "ASSIGNED", ":a": assigned_to, ":n": notes, ":u": now},
            expr_names={"#st": "status"}
        )

    def resolve_incident(self, incident_id: str, resolution_notes: str, resolved_by: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"incident_id": incident_id},
            update_expr=(
                "SET #st = :s, resolution_notes = :r, "
                "resolved_by = :rb, resolved_at = :ra, updated_at = :u"
            ),
            expr_values={
                ":s": "RESOLVED", ":r": resolution_notes,
                ":rb": resolved_by, ":ra": now, ":u": now
            },
            expr_names={"#st": "status"}
        )

    def update_status(self, incident_id: str, new_status: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"incident_id": incident_id},
            update_expr="SET #st = :s, updated_at = :u",
            expr_values={":s": new_status, ":u": now},
            expr_names={"#st": "status"}
        )

    def get_open_count(self) -> int:
        result = self.db.scan_items(
            filter_expression=Attr("status").eq("OPEN"),
            limit=500
        )
        return len(result["items"])