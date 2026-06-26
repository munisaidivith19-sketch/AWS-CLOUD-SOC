from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from utils.logger import get_logger

logger = get_logger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hardcoded for demo — in production pull from DB
DEMO_USERS = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("Admin@SOC2024"),
        "role": "admin",
        "full_name": "SOC Administrator",
        "email": "admin@soc.local"
    },
    "analyst1": {
        "username": "analyst1",
        "hashed_password": pwd_context.hash("Analyst@SOC2024"),
        "role": "security_analyst",
        "full_name": "Security Analyst 1",
        "email": "analyst1@soc.local"
    },
    "viewer1": {
        "username": "viewer1",
        "hashed_password": pwd_context.hash("Viewer@SOC2024"),
        "role": "viewer",
        "full_name": "SOC Viewer",
        "email": "viewer1@soc.local"
    }
}

class TokenData(BaseModel):
    username: str
    role: str

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = DEMO_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: dict, secret: str, algorithm: str, expires_minutes: int) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=algorithm)

def decode_token(token: str, secret: str, algorithm: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username or not role:
            return None
        return TokenData(username=username, role=role)
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        return None