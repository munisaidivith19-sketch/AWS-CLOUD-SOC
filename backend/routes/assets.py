from fastapi import APIRouter, Depends, HTTPException
from services.asset_service import AssetService
from middleware.auth_middleware import get_current_user, require_role

router = APIRouter(prefix="/assets", tags=["Assets"])
service = AssetService()

@router.get("")
def list_assets(current_user=Depends(get_current_user)):
    return service.get_all_assets()

@router.get("/{resource_id}")
def get_asset(resource_id: str, current_user=Depends(get_current_user)):
    asset = service.get_asset(resource_id)
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset

@router.post("/seed")
def seed_assets(current_user=Depends(require_role("admin"))):
    service.seed_assets()
    return {"message": "Assets seeded successfully"}