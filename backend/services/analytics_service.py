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
        result = self.db.scan_items(limit=1000)
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

        # Fill all days including zero-count days
        labels, data = [], []
        for i in range(days - 1, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            labels.append(d)
            data.append(daily.get(d, 0))

        return {"labels": labels, "data": data}

    def get_top_threats(self, limit: int = 5) -> dict:
        result = self.db.scan_items(limit=1000)
        counts = defaultdict(int)
        for item in result["items"]:
            counts[item.get("event_type", "Unknown")] += 1
        sorted_threats = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return {
            "labels": [t[0] for t in sorted_threats],
            "data":   [t[1] for t in sorted_threats]
        }

    def get_summary_stats(self) -> dict:
        result = self.db.scan_items(limit=1000)
        items  = result["items"]
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        recent = [
            i for i in items
            if datetime.fromisoformat(
                i.get("timestamp","2000-01-01").replace("Z","+00:00")
            ) >= last_24h
        ]
        return {
            "total_threats":   len(items),
            "last_24h":        len(recent),
            "open_threats":    sum(1 for i in items if i.get("status") == "OPEN"),
            "critical_count":  sum(1 for i in items if i.get("severity") == "CRITICAL"),
        }