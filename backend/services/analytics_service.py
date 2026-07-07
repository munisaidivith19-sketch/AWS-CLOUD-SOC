from collections import defaultdict
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Attr
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger
import os

logger = get_logger(__name__)

class AnalyticsService:
    def __init__(self):
        self.db = DynamoDBClient(os.getenv("THREATS_TABLE", "soc_threats"))

    def get_severity_distribution(self) -> dict:
        result = self.db.scan_items(limit=1000)
        counts = defaultdict(int)
        for item in result["items"]:
            counts[item.get("severity", "LOW")] += 1
        return {
            "labels": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            "data":   [counts["CRITICAL"], counts["HIGH"],
                       counts["MEDIUM"],   counts["LOW"]]
        }

    def get_threats_timeline(self, days: int = 30) -> dict:
        result = self.db.scan_items(limit=2000)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        daily  = defaultdict(int)

        for item in result["items"]:
            ts = item.get("timestamp", "")
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if dt >= cutoff:
                    day = dt.strftime("%Y-%m-%d")
                    daily[day] += 1
            except Exception:
                continue

        labels, data = [], []
        for i in range(days - 1, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            labels.append(d)
            data.append(daily.get(d, 0))

        return {"labels": labels, "data": data}

    def get_top_threats(self, limit: int = 5) -> dict:
        result = self.db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            counts[item.get("event_type", "Unknown")] += 1
        sorted_threats = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return {
            "labels": [t[0] for t in sorted_threats],
            "data":   [t[1] for t in sorted_threats]
        }

    def get_summary_stats(self) -> dict:
        result = self.db.scan_items(limit=2000)
        items  = result["items"]
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        recent = []
        for i in items:
            try:
                dt = datetime.fromisoformat(
                    i.get("timestamp", "2000-01-01").replace("Z", "+00:00")
                )
                if dt >= last_24h:
                    recent.append(i)
            except Exception:
                continue

        return {
            "total_threats":  len(items),
            "last_24h":       len(recent),
            "open_threats":   sum(1 for i in items if i.get("status") == "OPEN"),
            "critical_count": sum(1 for i in items if i.get("severity") == "CRITICAL"),
        }

    def get_most_active_users(self) -> dict:
        result = self.db.scan_items(limit=2000)
        counts = defaultdict(int)
        for item in result["items"]:
            user = item.get("username", "unknown")
            counts[user] += 1
        sorted_users = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {
            "labels": [u[0] for u in sorted_users],
            "data":   [u[1] for u in sorted_users]
        }

    def get_risk_trend(self) -> dict:
        result = self.db.scan_items(limit=2000)
        daily  = defaultdict(list)
        for item in result["items"]:
            ts = item.get("timestamp", "")
            try:
                dt    = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                day   = dt.strftime("%Y-%m-%d")
                score = int(item.get("risk_score", 0))
                daily[day].append(score)
            except Exception:
                continue

        labels, data = [], []
        for i in range(29, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            scores = daily.get(d, [])
            labels.append(d)
            data.append(round(sum(scores) / len(scores), 1) if scores else 0)

        return {"labels": labels, "data": data}