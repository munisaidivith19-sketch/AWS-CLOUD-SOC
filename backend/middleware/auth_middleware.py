from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt_handler import decode_token
from utils.logger import get_logger
import os

logger   = get_logger(__name__)
security = HTTPBearer()

ROLE_HIERARCHY = {
    "admin":                   8,
    "soc_manager":             7,
    "threat_hunter":           6,
    "incident_responder":      5,
    "cloud_security_engineer": 5,
    "soc_analyst":             4,
    "security_engineer":       3,
    "viewer":                  1,
    # Legacy role names
    "security_analyst":        4,
}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token     = credentials.credentials
    secret    = os.getenv("JWT_SECRET_KEY", "soc-platform-super-secret-key-change-in-production-2024")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    token_data = decode_token(token, secret, algorithm)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return token_data


def require_role(minimum_role: str):
    def checker(current_user=Depends(get_current_user)):
        user_level     = ROLE_HIERARCHY.get(current_user.role, 0)
        required_level = ROLE_HIERARCHY.get(minimum_role, 99)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {minimum_role}, Your role: {current_user.role}"
            )
        return current_user
    return checker