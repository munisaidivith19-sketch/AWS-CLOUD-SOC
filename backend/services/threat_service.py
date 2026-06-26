import uuid
from datetime import datetime, timezone
from typing import Optional
from boto3.dynamodb.conditions import Attr
from database.dynamo_client import DynamoDBClient
from utils.risk_scorer import get_risk_score, get_severity, get_recommendations
from utils.logger import get_logger
import os

logger = get_logger(__name__)

class ThreatService:
    def __init__(self):
        self.db = DynamoDBClient(os.getenv("THREATS_TABLE", "soc_threats"))

    def create_threat(self, event_type: str, source_ip: str,
                      username: str, description: str,
                      region: str = "us-east-1",
                      resource_id: str = None) -> dict:
        score    = get_risk_score(event_type)
        severity = get_severity(score)
        recs     = get_recommendations(event_type, severity)
        threat_id = f"THR-{uuid.uuid4().hex[:8].upper()}"

        item = {
            "threat_id":       threat_id,
            "event_type":      event_type,
            "severity":        severity,
            "risk_score":      score,
            "source_ip":       source_ip,
            "username":        username,
            "timestamp":       datetime.now(timezone.utc).isoformat(),
            "status":          "OPEN",
            "description":     description,
            "region":          region,
            "resource_id":     resource_id or "N/A",
            "recommendations": recs,
            "ai_analysis":     self._generate_ai_analysis(event_type, severity, score),
        }
        self.db.put_item(item)
        logger.info(f"Threat created: {threat_id} | {severity} | {event_type}")
        return item

    def _generate_ai_analysis(self, event_type: str, severity: str, score: int) -> str:
        templates = {
            "ConsoleLogin_Root":
                f"Root account console login detected (risk {score}/100). "
                "Root logins should never occur in a well-governed AWS account. "
                "This may indicate compromised root credentials or unauthorized access. "
                "Immediate investigation is required.",
            "AttachUserPolicy_Admin":
                f"AdministratorAccess policy attachment detected (risk {score}/100). "
                "Attaching full admin rights to a user is a strong indicator of privilege escalation. "
                "Verify this was authorized by your change management process.",
            "DeleteSecurityGroup":
                f"Security group deletion detected (risk {score}/100). "
                "Removing security groups can expose resources to unrestricted network access. "
                "Validate this is part of an authorized infrastructure change.",
            "CreateUser":
                f"New IAM user creation detected (risk {score}/100). "
                "Verify this user was created through your standard onboarding process. "
                "Ensure MFA is enforced and least-privilege permissions are applied.",
            "StopLogging":
                f"CloudTrail logging disabled (risk {score}/100). "
                "This is a critical indicator of an attacker attempting to hide their tracks. "
                "Re-enable logging immediately and treat this as a potential breach.",
        }
        return templates.get(
            event_type,
            f"Security event '{event_type}' detected with risk score {score}/100 "
            f"(severity: {severity}). Review event context and correlate with other "
            "recent activity to determine if this is part of an attack pattern."
        )

    def get_all_threats(self, severity: str = None,
                        status: str = None, limit: int = 50) -> dict:
        filters = []
        if severity:
            filters.append(Attr("severity").eq(severity))
        if status:
            filters.append(Attr("status").eq(status))

        combined = None
        for f in filters:
            combined = f if combined is None else combined & f

        result = self.db.scan_items(filter_expression=combined, limit=limit)
        items  = sorted(result["items"], key=lambda x: x.get("timestamp", ""), reverse=True)
        return {"total": len(items), "items": items, "last_key": None}

    def get_threat(self, threat_id: str) -> Optional[dict]:
        return self.db.get_item({"threat_id": threat_id})

    def update_status(self, threat_id: str, new_status: str) -> bool:
        from datetime import datetime, timezone
        return self.db.update_item(
            key={"threat_id": threat_id},
            update_expr="SET #st = :s, updated_at = :u",
            expr_values={":s": new_status, ":u": datetime.now(timezone.utc).isoformat()},
            expr_names={"#st": "status"}
        )

    def get_counts(self) -> dict:
        result = self.db.scan_items(limit=1000)
        items  = result["items"]
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        status_counts = {"OPEN": 0, "ASSIGNED": 0, "RESOLVED": 0, "DISMISSED": 0}
        for item in items:
            sev = item.get("severity", "LOW")
            st  = item.get("status", "OPEN")
            counts[sev]        = counts.get(sev, 0) + 1
            status_counts[st]  = status_counts.get(st, 0) + 1
        return {
            "total":        len(items),
            "by_severity":  counts,
            "by_status":    status_counts
        }