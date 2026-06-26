from fastapi import APIRouter, Depends, Query
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])
service = AnalyticsService()

@router.get("/severity")
def severity_distribution(current_user=Depends(get_current_user)):
    return service.get_severity_distribution()

@router.get("/timeline")
def threats_timeline(
    days: int = Query(30, ge=7, le=90),
    current_user=Depends(get_current_user)
):
    return service.get_threats_timeline(days=days)

@router.get("/top-threats")
def top_threats(
    limit: int = Query(5, ge=3, le=10),
    current_user=Depends(get_current_user)
):
    return service.get_top_threats(limit=limit)

@router.get("/summary")
def summary_stats(current_user=Depends(get_current_user)):
    return service.get_summary_stats()