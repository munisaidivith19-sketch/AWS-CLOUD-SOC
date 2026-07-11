from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from api.v1.router import api_router
from utils.logger import get_logger
from dotenv import load_dotenv
import os, time

load_dotenv()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 55)
    logger.info("  AWS Cloud SOC Platform — Starting")
    logger.info(f"  Environment : {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"  Region      : {os.getenv('AWS_REGION', 'ap-south-2')}")
    logger.info("=" * 55)

    # Seed users — non-fatal if table missing
    try:
        from services.user_service import UserService
        UserService().seed_initial_users()
        logger.info("✅ User seeding complete")
    except Exception as e:
        logger.warning(f"⚠️  User seeding skipped (non-fatal): {e}")

    yield
    logger.info("Backend shutting down.")


app = FastAPI(
    title="AWS Cloud SOC Platform",
    description="Real-time AWS Threat Detection and Incident Response",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request timing ────────────────────────────────────────
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start    = time.time()
    response = await call_next(request)
    ms       = round((time.time() - start) * 1000, 2)
    response.headers["X-Response-Time"] = f"{ms}ms"
    if request.url.path not in ("/health", "/docs", "/redoc", "/openapi.json"):
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({ms}ms)")
    return response

# ── Global exception handler ─────────────────────────────
@app.exception_handler(Exception)
async def global_exception(request: Request, exc: Exception):
    logger.error(f"Unhandled: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": str(request.url.path)}
    )

# ── Routes ────────────────────────────────────────────────
app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health():
    return {
        "status":  "healthy",
        "service": "AWS Cloud SOC Platform",
        "version": "2.0.0",
        "region":  os.getenv("AWS_REGION", "ap-south-2"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)