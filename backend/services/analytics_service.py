from collections import defaultdict
from datetime import datetime, timedelta, timezone
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger
import os

logger = get_logger(__name__)

class AnalyticsService:
    def __init__(self):
        self.threats_db   = DynamoDBClient(os.getenv("THREATS_TABLE",    "soc_threats"))
        self.incidents_db = DynamoDBClient(os.getenv("INCIDENTS_TABLE",  "soc_incidents"))
        self.audit_db     = DynamoDBClient(os.getenv("AUDIT_LOGS_TABLE", "soc_audit_logs"))

    def _safe_ts(self, ts: str) -> datetime:
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            return datetime(2000, 1, 1, tzinfo=timezone.utc)

    def get_severity_distribution(self) -> dict:
        result = self.threats_db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            counts[item.get("severity", "LOW")] += 1
        return {
            "labels": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            "data":   [counts["CRITICAL"], counts["HIGH"], counts["MEDIUM"], counts["LOW"]]
        }

    def get_threats_timeline(self, days: int = 30) -> dict:
        result = self.threats_db.scan_items(limit=5000)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        daily  = defaultdict(int)
        for item in result["items"]:
            dt = self._safe_ts(item.get("timestamp", ""))
            if dt >= cutoff:
                daily[dt.strftime("%Y-%m-%d")] += 1
        labels, data = [], []
        for i in range(days - 1, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            labels.append(d)
            data.append(daily.get(d, 0))
        return {"labels": labels, "data": data}

    def get_top_threats(self, limit: int = 5) -> dict:
        result = self.threats_db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            counts[item.get("event_type", "Unknown")] += 1
        sorted_t = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return {"labels": [t[0] for t in sorted_t], "data": [t[1] for t in sorted_t]}

    def get_summary_stats(self) -> dict:
        threats   = self.threats_db.scan_items(limit=5000)["items"]
        incidents = self.incidents_db.scan_items(limit=500)["items"]
        audit     = self.audit_db.scan_items(limit=5000)["items"]

        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        recent_threats = [
            t for t in threats
            if self._safe_ts(t.get("timestamp", "")) >= cutoff
        ]
        recent_audit = [
            a for a in audit
            if self._safe_ts(a.get("timestamp", "")) >= cutoff
        ]

        return {
            "total_threats":    len(threats),
            "last_24h":         len(recent_threats),
            "open_threats":     sum(1 for t in threats if t.get("status") == "OPEN"),
            "critical_count":   sum(1 for t in threats if t.get("severity") == "CRITICAL"),
            "total_incidents":  len(incidents),
            "open_incidents":   sum(1 for i in incidents if i.get("status") == "OPEN"),
            "total_api_calls":  len(audit),
            "api_calls_24h":    len(recent_audit),
        }

    def get_most_active_users(self) -> dict:
        result = self.threats_db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            user = item.get("username", "unknown")
            if user and user != "unknown":
                counts[user] += 1
        sorted_u = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {"labels": [u[0] for u in sorted_u], "data": [u[1] for u in sorted_u]}

    def get_top_source_ips(self) -> dict:
        result = self.threats_db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            ip = item.get("source_ip", "unknown")
            if ip and ip != "unknown":
                counts[ip] += 1
        sorted_ips = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {"labels": [i[0] for i in sorted_ips], "data": [i[1] for i in sorted_ips]}

    def get_risk_trend(self) -> dict:
        result = self.threats_db.scan_items(limit=2000)
        daily  = defaultdict(list)
        for item in result["items"]:
            dt    = self._safe_ts(item.get("timestamp", ""))
            score = int(item.get("risk_score", 0))
            daily[dt.strftime("%Y-%m-%d")].append(score)
        labels, data = [], []
        for i in range(29, -1, -1):
            d      = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            scores = daily.get(d, [])
            labels.append(d)
            data.append(round(sum(scores) / len(scores), 1) if scores else 0)
        return {"labels": labels, "data": data}

    def get_incident_trend(self) -> dict:
        result = self.incidents_db.scan_items(limit=1000)
        daily  = defaultdict(int)
        for item in result["items"]:
            dt = self._safe_ts(item.get("created_at", ""))
            daily[dt.strftime("%Y-%m-%d")] += 1
        labels, data = [], []
        for i in range(29, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            labels.append(d)
            data.append(daily.get(d, 0))
        return {"labels": labels, "data": data}

    def get_audit_log_stats(self) -> dict:
        result = self.audit_db.scan_items(limit=5000)
        items  = result["items"]
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        by_service = defaultdict(int)
        by_user    = defaultdict(int)
        recent     = []

        for item in items:
            svc  = item.get("event_source", "unknown").split(".")[0].upper()
            user = item.get("user", "unknown")
            by_service[svc]  += 1
            by_user[user]    += 1
            dt = self._safe_ts(item.get("timestamp", ""))
            if dt >= cutoff:
                recent.append(item)

        sorted_svc  = sorted(by_service.items(), key=lambda x: x[1], reverse=True)[:10]
        sorted_user = sorted(by_user.items(),    key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_events":    len(items),
            "events_24h":      len(recent),
            "top_services":    {"labels": [s[0] for s in sorted_svc],  "data": [s[1] for s in sorted_svc]},
            "top_users":       {"labels": [u[0] for u in sorted_user], "data": [u[1] for u in sorted_user]},
            "recent_events":   sorted(recent, key=lambda x: x.get("timestamp",""), reverse=True)[:20],
        }