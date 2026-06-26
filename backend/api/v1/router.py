from fastapi import APIRouter
from routes import auth, threats, incidents, assets, analytics, dashboard

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(threats.router)
api_router.include_router(incidents.router)
api_router.include_router(assets.router)
api_router.include_router(analytics.router)