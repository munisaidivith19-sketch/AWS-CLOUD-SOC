import uuid
from datetime import datetime, timezone
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger
import os

logger = get_logger(__name__)

# Seed data — represents what's in your AWS account
SEED_ASSETS = [
    {"resource_type": "IAM_USER",  "resource_name": "admin",        "status": "ACTIVE",  "region": "global"},
    {"resource_type": "IAM_USER",  "resource_name": "analyst1",     "status": "ACTIVE",  "region": "global"},
    {"resource_type": "IAM_USER",  "resource_name": "viewer1",      "status": "ACTIVE",  "region": "global"},
    {"resource_type": "EC2",       "resource_name": "soc-server",   "status": "RUNNING", "region": "us-east-1"},
    {"resource_type": "S3",        "resource_name": "soc-logs-bucket",  "status": "ACTIVE", "region": "us-east-1"},
    {"resource_type": "S3",        "resource_name": "cloudtrail-logs",  "status": "ACTIVE", "region": "us-east-1"},
    {"resource_type": "LAMBDA",    "resource_name": "threat-detector",  "status": "ACTIVE", "region": "us-east-1"},
    {"resource_type": "DYNAMODB",  "resource_name": "soc_threats",      "status": "ACTIVE", "region": "us-east-1"},
    {"resource_type": "DYNAMODB",  "resource_name": "soc_incidents",    "status": "ACTIVE", "region": "us-east-1"},
    {"resource_type": "SNS",       "resource_name": "soc-alerts",       "status": "ACTIVE", "region": "us-east-1"},
]

class AssetService:
    def __init__(self):
        self.db = DynamoDBClient(os.getenv("ASSETS_TABLE", "soc_assets"))

    def seed_assets(self):
        """Call once to populate the Assets table with initial data."""
        now = datetime.now(timezone.utc).isoformat()
        for a in SEED_ASSETS:
            item = {
                "resource_id":   f"ASSET-{uuid.uuid4().hex[:8].upper()}",
                "resource_type": a["resource_type"],
                "resource_name": a["resource_name"],
                "status":        a["status"],
                "region":        a["region"],
                "threat_count":  0,
                "last_seen":     now,
                "tags":          {"project": "soc-platform", "env": "production"}
            }
            self.db.put_item(item)
        logger.info(f"Seeded {len(SEED_ASSETS)} assets")

    def get_all_assets(self) -> dict:
        result = self.db.scan_items(limit=200)
        return {"total": len(result["items"]), "items": result["items"]}

    def get_asset(self, resource_id: str):
        return self.db.get_item({"resource_id": resource_id})

    def get_asset_count(self) -> int:
        result = self.db.scan_items(limit=200)
        return len(result["items"])