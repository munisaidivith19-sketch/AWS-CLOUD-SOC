from fastapi import APIRouter, HTTPException, status
from models.user import LoginRequest, TokenResponse
from utils.jwt_handler import authenticate_user, create_access_token
from utils.logger import get_logger
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate_user(body.username, body.password)
    if not user:
        logger.warning(f"Failed login attempt for: {body.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        secret=os.getenv("JWT_SECRET_KEY", "secret"),
        algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        expires_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 480))
    )
    logger.info(f"Login success: {user['username']} ({user['role']})")
    return TokenResponse(
        access_token=token,
        username=user["username"],
        role=user["role"],
        full_name=user["full_name"]
    )

@router.get("/me")
def get_me(current_user=None):
    from middleware.auth_middleware import get_current_user
    from fastapi import Depends
    return {"message": "Use /auth/me with Bearer token"}