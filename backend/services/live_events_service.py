import boto3
import os
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Attr
from database.dynamo_client import DynamoDBClient
from services.ai_service import detect_attack_chain
from utils.logger import get_logger

logger = get_logger(__name__)

def get_client(service: str):
    return boto3.client(
        service,
        region_name=os.getenv("AWS_REGION", "ap-south-2"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

class LiveEventsService:
    def __init__(self):
        self.threats_db = DynamoDBClient(os.getenv("THREATS_TABLE", "soc_threats"))

    def get_recent_events(self, limit: int = 100) -> dict:
        """
        Returns recent threats from DynamoDB as live event feed.
        These are real CloudTrail events detected by Lambda.
        """
        try:
            result = self.threats_db.scan_items(limit=limit)
            items  = sorted(
                result["items"],
                key=lambda x: x.get("timestamp", ""),
                reverse=True
            )
            return {
                "total":      len(items),
                "events":     items,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"get_recent_events error: {e}")
            return {"total": 0, "events": [], "last_updated": datetime.now(timezone.utc).isoformat()}

    def get_login_activity(self) -> dict:
        """
        Returns console login activity from DynamoDB threats table.
        Filters for login-related events.
        """
        try:
            result = self.threats_db.scan_items(limit=500)
            items  = result["items"]

            login_events = [
                i for i in items
                if any(kw in i.get("event_type", "").lower()
                       for kw in ["login", "consolesignin", "signin", "consolelogin"])
                or any(kw in i.get("raw_event_name", "").lower()
                       for kw in ["consolelogin", "signin"])
            ]

            root_logins   = [i for i in login_events if "root" in i.get("username", "").lower()]
            failed_logins = [i for i in login_events if "fail" in i.get("description", "").lower()]

            # Recent unique users (last 24h)
            cutoff     = datetime.now(timezone.utc) - timedelta(hours=24)
            recent_24h = []
            for i in items:
                try:
                    ts = datetime.fromisoformat(i.get("timestamp","2000-01-01").replace("Z","+00:00"))
                    if ts >= cutoff:
                        recent_24h.append(i)
                except Exception:
                    continue

            active_users = list({i.get("username","unknown") for i in recent_24h if i.get("username")})

            return {
                "total_logins":     len(login_events),
                "root_logins":      len(root_logins),
                "failed_logins":    len(failed_logins),
                "active_users_24h": len(active_users),
                "active_usernames": active_users[:10],
                "recent_logins":    sorted(login_events, key=lambda x: x.get("timestamp",""), reverse=True)[:20],
                "api_calls_24h":    len(recent_24h),
            }
        except Exception as e:
            logger.error(f"get_login_activity error: {e}")
            return {
                "total_logins": 0, "root_logins": 0,
                "failed_logins": 0, "active_users_24h": 0,
                "active_usernames": [], "recent_logins": [], "api_calls_24h": 0
            }

    def get_attack_chains(self) -> dict:
        """Detect multi-stage attack patterns from recent threats."""
        try:
            result = self.threats_db.scan_items(limit=200)
            items  = sorted(result["items"], key=lambda x: x.get("timestamp",""), reverse=True)[:50]
            chains = detect_attack_chain(items)
            return {"chains": chains, "total": len(chains)}
        except Exception as e:
            logger.error(f"get_attack_chains error: {e}")
            return {"chains": [], "total": 0}

    def get_stream_data(self) -> dict:
        """
        Data package sent via SSE every 15 seconds.
        Contains everything the frontend needs to update.
        """
        try:
            result  = self.threats_db.scan_items(limit=500)
            items   = result["items"]
            recent  = sorted(items, key=lambda x: x.get("timestamp",""), reverse=True)[:5]

            counts  = {"CRITICAL":0,"HIGH":0,"MEDIUM":0,"LOW":0}
            statuses = {"OPEN":0,"ASSIGNED":0,"RESOLVED":0,"DISMISSED":0}
            for i in items:
                sev = i.get("severity","LOW")
                st  = i.get("status","OPEN")
                counts[sev]   = counts.get(sev,0) + 1
                statuses[st]  = statuses.get(st,0) + 1

            return {
                "type":             "update",
                "timestamp":        datetime.now(timezone.utc).isoformat(),
                "total_threats":    len(items),
                "critical_count":   counts["CRITICAL"],
                "high_count":       counts["HIGH"],
                "open_count":       statuses["OPEN"],
                "recent_threats":   recent,
                "severity_counts":  counts,
                "status_counts":    statuses,
            }
        except Exception as e:
            logger.error(f"get_stream_data error: {e}")
            return {
                "type": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }