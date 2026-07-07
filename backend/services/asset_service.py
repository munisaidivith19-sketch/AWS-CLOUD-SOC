from services.aws_inventory_service import AWSInventoryService
from utils.logger import get_logger

logger = get_logger(__name__)

class AssetService:
    def __init__(self):
        self.aws = AWSInventoryService()

    def get_all_assets(self) -> dict:
        """Returns real AWS assets discovered live from your account."""
        try:
            assets = self.aws.discover_all_assets()
            return {"total": len(assets), "items": assets}
        except Exception as e:
            logger.error(f"Asset discovery failed: {e}")
            return {"total": 0, "items": []}

    def get_asset(self, resource_id: str):
        assets = self.aws.discover_all_assets()
        for a in assets:
            if a["resource_id"] == resource_id:
                return a
        return None

    def get_asset_count(self) -> int:
        try:
            assets = self.aws.discover_all_assets()
            return len(assets)
        except Exception as e:
            logger.error(f"Asset count failed: {e}")
            return 0

    def seed_assets(self):
        """No longer needed — assets come from AWS directly."""
        logger.info("Seed assets called but ignored — using live AWS data")
        return {"message": "Assets are now discovered live from AWS"}