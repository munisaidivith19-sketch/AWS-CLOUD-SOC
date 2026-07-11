from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from utils.jwt_handler import create_access_token
from middleware.auth_middleware import get_current_user
from utils.logger import get_logger
from passlib.context import CryptContext
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    username:     str
    role:         str
    full_name:    str


def _get_user_service():
    """Lazy import to avoid startup failures if soc_users table missing."""
    try:
        from services.user_service import UserService
        return UserService()
    except Exception as e:
        logger.warning(f"UserService unavailable: {e}")
        return None


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = None

    # ── Try DynamoDB users first ─────────────────────────
    svc = _get_user_service()
    if svc:
        try:
            user = svc.authenticate(body.username, body.password)
        except Exception as e:
            logger.warning(f"DynamoDB auth error: {e}")
            user = None

    # ── Fallback to hardcoded demo users ─────────────────
    # This ensures the system always works even if soc_users
    # table doesn't exist or seeding failed
    if not user:
        user = _fallback_auth(body.username, body.password)

    if not user:
        logger.warning(f"Failed login: {body.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or account disabled"
        )

    token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        secret=os.getenv("JWT_SECRET_KEY", "soc-platform-super-secret-key-change-in-production-2024"),
        algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        expires_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 480))
    )
    logger.info(f"Login success: {user['username']} ({user['role']})")
    return TokenResponse(
        access_token=token,
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name", user["username"])
    )


def _fallback_auth(username: str, password: str) -> Optional[dict]:
    """
    Hardcoded fallback users.
    Used when soc_users DynamoDB table is unavailable.
    """
    DEMO_USERS = {
        "admin": {
            "username":  "admin",
            "password":  "Admin@SOC2024",
            "role":      "admin",
            "full_name": "SOC Administrator",
        },
        "analyst1": {
            "username":  "analyst1",
            "password":  "Analyst@SOC2024",
            "role":      "soc_analyst",
            "full_name": "Security Analyst 1",
        },
        "viewer1": {
            "username":  "viewer1",
            "password":  "Viewer@SOC2024",
            "role":      "viewer",
            "full_name": "SOC Viewer",
        },
    }
    demo = DEMO_USERS.get(username)
    if demo and demo["password"] == password:
        return demo
    return None


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    svc  = _get_user_service()
    if svc:
        try:
            user = svc.get_user_by_username(current_user.username)
            if user:
                return user
        except Exception:
            pass
    return {
        "username": current_user.username,
        "role":     current_user.role,
        "full_name": current_user.username,
    }