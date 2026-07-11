from fastapi import APIRouter
from routes import auth, threats, incidents, assets, analytics, dashboard
from utils.logger import get_logger

logger     = get_logger("router")
api_router = APIRouter(prefix="/api/v1")

# ── Core routes ───────────────────────────────────────────
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(threats.router)
api_router.include_router(incidents.router)
api_router.include_router(assets.router)
api_router.include_router(analytics.router)

# ── Optional routes ───────────────────────────────────────
def _include(module: str, attr: str = "router"):
    try:
        import importlib
        mod = importlib.import_module(module)
        api_router.include_router(getattr(mod, attr))
        logger.info(f"Route loaded: {module}")
    except Exception as e:
        logger.error(f"Route failed: {module} — {e}")

_include("routes.live_events")
_include("routes.ai_investigation")
_include("routes.users")
_include("routes.reports")