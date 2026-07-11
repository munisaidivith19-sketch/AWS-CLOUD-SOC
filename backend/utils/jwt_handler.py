from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from pydantic import BaseModel
from utils.logger import get_logger

logger = get_logger(__name__)

class TokenData(BaseModel):
    username: str
    role:     str

def create_access_token(data: dict, secret: str, algorithm: str, expires_minutes: int) -> str:
    to_encode = data.copy()
    expire    = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=algorithm)

def decode_token(token: str, secret: str, algorithm: str) -> Optional[TokenData]:
    try:
        payload  = jwt.decode(token, secret, algorithms=[algorithm])
        username = payload.get("sub")
        role     = payload.get("role")
        if not username or not role:
            return None
        return TokenData(username=username, role=role)
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        return None