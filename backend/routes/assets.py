from fastapi import APIRouter, Depends, HTTPException
from services.asset_service import AssetService
from services.aws_inventory_service import AWSInventoryService
from middleware.auth_middleware import get_current_user, require_role

router  = APIRouter(prefix="/assets", tags=["Assets"])
service = AssetService()
aws_svc = AWSInventoryService()

@router.get("")
def list_assets(current_user=Depends(get_current_user)):
    return service.get_all_assets()

@router.get("/aws-status")
def aws_service_status(current_user=Depends(get_current_user)):
    """Returns live status of all AWS services in your account."""
    return aws_svc.get_aws_service_status()

@router.get("/{resource_id}")
def get_asset(resource_id: str, current_user=Depends(get_current_user)):
    asset = service.get_asset(resource_id)
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset

@router.post("/seed")
def seed_assets(current_user=Depends(require_role("admin"))):
    """Deprecated — assets now come from live AWS discovery."""
    return {"message": "Assets are now discovered live from your AWS account. No seeding needed."}