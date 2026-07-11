from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.user_service import UserService, ROLES, ROLE_PERMISSIONS
from middleware.auth_middleware import require_role, get_current_user
from utils.logger import get_logger

router  = APIRouter(prefix="/users", tags=["User Management"])
service = UserService()
logger  = get_logger(__name__)


class CreateUserRequest(BaseModel):
    username:              str
    full_name:             str
    email:                 str
    password:              str
    department:            Optional[str] = ""
    designation:           Optional[str] = ""
    phone:                 Optional[str] = ""
    role:                  str = "viewer"
    mfa_enabled:           bool = False
    force_password_change: bool = False


class UpdateUserRequest(BaseModel):
    full_name:   Optional[str] = None
    email:       Optional[str] = None
    department:  Optional[str] = None
    designation: Optional[str] = None
    phone:       Optional[str] = None
    role:        Optional[str] = None
    status:      Optional[str] = None
    mfa_enabled: Optional[bool] = None


class ResetPasswordRequest(BaseModel):
    new_password: str
    force_change: bool = True


def _to_dict(obj) -> dict:
    """Compatible with both Pydantic v1 and v2."""
    try:
        return obj.model_dump()
    except AttributeError:
        return obj.dict()


@router.get("")
def list_users(current_user=Depends(require_role("admin"))):
    return service.get_all_users()


@router.get("/roles")
def get_roles(current_user=Depends(require_role("admin"))):
    return {"roles": ROLES, "permissions": ROLE_PERMISSIONS}


@router.get("/me")
def get_current_user_profile(current_user=Depends(get_current_user)):
    user = service.get_user_by_username(current_user.username)
    if not user:
        return {
            "username":  current_user.username,
            "role":      current_user.role,
            "full_name": current_user.username,
            "status":    "ACTIVE",
        }
    return user


@router.get("/{user_id}")
def get_user(user_id: str, current_user=Depends(require_role("admin"))):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.post("", status_code=201)
def create_user(
    body: CreateUserRequest,
    current_user=Depends(require_role("admin"))
):
    if body.role not in ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {ROLES}")
    try:
        data = _to_dict(body)
        user = service.create_user(data)
        logger.info(f"User created by {current_user.username}: {body.username}")
        return user
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Create user error: {e}")
        raise HTTPException(500, f"Failed to create user: {str(e)}")


@router.put("/{user_id}")
def update_user(
    user_id: str,
    body: UpdateUserRequest,
    current_user=Depends(require_role("admin"))
):
    data = {k: v for k, v in _to_dict(body).items() if v is not None}
    if "role" in data and data["role"] not in ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {ROLES}")
    ok = service.update_user(user_id, data)
    if not ok:
        raise HTTPException(500, "Failed to update user")
    return {"message": f"User {user_id} updated"}


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user=Depends(require_role("admin"))
):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("username") == current_user.username:
        raise HTTPException(400, "Cannot delete your own account")
    ok = service.delete_user(user_id)
    if not ok:
        raise HTTPException(500, "Failed to delete user")
    return {"message": f"User {user_id} deleted"}


@router.post("/{user_id}/disable")
def disable_user(
    user_id: str,
    current_user=Depends(require_role("admin"))
):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("username") == current_user.username:
        raise HTTPException(400, "Cannot disable your own account")
    ok = service.disable_user(user_id)
    if not ok:
        raise HTTPException(500, "Failed to disable user")
    return {"message": f"User {user_id} disabled"}


@router.post("/{user_id}/enable")
def enable_user(
    user_id: str,
    current_user=Depends(require_role("admin"))
):
    ok = service.enable_user(user_id)
    if not ok:
        raise HTTPException(500, "Failed to enable user")
    return {"message": f"User {user_id} enabled"}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: str,
    body: ResetPasswordRequest,
    current_user=Depends(require_role("admin"))
):
    ok = service.reset_password(user_id, body.new_password, body.force_change)
    if not ok:
        raise HTTPException(500, "Failed to reset password")
    return {"message": "Password reset successfully"}


@router.post("/{user_id}/temp-password")
def generate_temp_password(
    user_id: str,
    current_user=Depends(require_role("admin"))
):
    try:
        temp_pw = service.generate_temp_password(user_id)
        return {
            "temp_password": temp_pw,
            "message": "Temporary password generated. User must change on next login."
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to generate temp password: {str(e)}")