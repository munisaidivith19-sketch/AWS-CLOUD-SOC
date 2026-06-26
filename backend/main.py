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
    logger.info("=" * 50)
    logger.info("  AWS Cloud SOC Platform — Backend Starting")
    logger.info(f"  Environment : {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"  Region      : {os.getenv('AWS_REGION', 'us-east-1')}")
    logger.info("=" * 50)
    yield
    logger.info("Backend shutting down.")

app = FastAPI(
    title="AWS Cloud SOC Platform",
    description="Real-time threat detection and incident response API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    response.headers["X-Response-Time"] = f"{duration}ms"
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": str(request.url.path)}
    )

# Mount all routes
app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status":  "healthy",
        "service": "AWS Cloud SOC Platform",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "region":  os.getenv("AWS_REGION", "us-east-1")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)