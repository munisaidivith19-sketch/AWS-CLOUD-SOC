import uuid
import os
import secrets
import string
from datetime import datetime, timezone
from typing import Optional
from passlib.context import CryptContext
from boto3.dynamodb.conditions import Attr
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger

logger      = get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS_TABLE = os.getenv("USERS_TABLE", "soc_users")

ROLES = [
    "admin", "soc_manager", "soc_analyst",
    "threat_hunter", "incident_responder",
    "cloud_security_engineer", "security_engineer", "viewer"
]

ROLE_PERMISSIONS = {
    "admin": [
        "dashboard", "threats", "incidents", "live_monitor",
        "ai_investigation", "reports", "assets", "analytics",
        "users", "audit_logs"
    ],
    "soc_manager": [
        "dashboard", "threats", "incidents", "reports",
        "analytics", "assets", "live_monitor", "ai_investigation"
    ],
    "soc_analyst": [
        "threats", "incidents", "ai_investigation", "live_monitor"
    ],
    "threat_hunter": [
        "threats", "analytics", "live_monitor", "ai_investigation"
    ],
    "incident_responder": [
        "incidents", "threats", "live_monitor"
    ],
    "cloud_security_engineer": [
        "assets", "live_monitor", "analytics", "threats"
    ],
    "security_engineer": [
        "assets", "live_monitor"
    ],
    "viewer": [
        "dashboard"
    ],
}

INITIAL_USERS = [
    {"username": "admin",    "password": "Admin@SOC2024",   "role": "admin",       "full_name": "SOC Administrator",  "email": "admin@soc.local",    "department": "Security Operations", "designation": "SOC Administrator"},
    {"username": "analyst1", "password": "Analyst@SOC2024", "role": "soc_analyst", "full_name": "Security Analyst 1", "email": "analyst1@soc.local", "department": "SOC",                 "designation": "SOC Analyst"},
    {"username": "viewer1",  "password": "Viewer@SOC2024",  "role": "viewer",      "full_name": "SOC Viewer",         "email": "viewer1@soc.local",  "department": "Management",          "designation": "Viewer"},
]


class UserService:
    def __init__(self):
        self.db = DynamoDBClient(USERS_TABLE)

    def seed_initial_users(self):
        """Create default users if they don't exist."""
        for u in INITIAL_USERS:
            try:
                existing = self.get_user_by_username(u["username"])
                if existing:
                    continue
                user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
                now     = datetime.now(timezone.utc).isoformat()
                item = {
                    "user_id":               user_id,
                    "username":              u["username"],
                    "full_name":             u["full_name"],
                    "email":                 u["email"],
                    "department":            u.get("department", ""),
                    "designation":           u.get("designation", ""),
                    "phone":                 "",
                    "role":                  u["role"],
                    "status":                "ACTIVE",
                    "mfa_enabled":           False,
                    "failed_logins":         0,
                    "force_password_change": False,
                    "hashed_password":       pwd_context.hash(u["password"]),
                    "created_at":            now,
                    "updated_at":            now,
                    "last_login":            None,
                }
                self.db.put_item(item)
                logger.info(f"Seeded user: {u['username']}")
            except Exception as e:
                logger.warning(f"Seed failed for {u['username']}: {e}")

    def verify_password(self, plain: str, hashed: str) -> bool:
        try:
            return pwd_context.verify(plain, hashed)
        except Exception:
            return False

    def authenticate(self, username: str, password: str) -> Optional[dict]:
        user = self.get_user_by_username(username)
        if not user:
            return None
        if user.get("status") == "DISABLED":
            logger.warning(f"Login attempt on disabled account: {username}")
            return None
        if int(user.get("failed_logins", 0)) >= 5:
            logger.warning(f"Account locked (too many failures): {username}")
            return None
        if not self.verify_password(password, user.get("hashed_password", "")):
            self._increment_failed(user["user_id"])
            return None
        self._reset_failed(user["user_id"])
        self._update_last_login(user["user_id"])
        return user

    def _increment_failed(self, user_id: str):
        try:
            self.db.update_item(
                key={"user_id": user_id},
                update_expr="SET failed_logins = if_not_exists(failed_logins, :z) + :inc",
                expr_values={":inc": 1, ":z": 0}
            )
        except Exception as e:
            logger.warning(f"Failed to increment failed_logins: {e}")

    def _reset_failed(self, user_id: str):
        try:
            self.db.update_item(
                key={"user_id": user_id},
                update_expr="SET failed_logins = :z",
                expr_values={":z": 0}
            )
        except Exception as e:
            logger.warning(f"Failed to reset failed_logins: {e}")

    def _update_last_login(self, user_id: str):
        try:
            self.db.update_item(
                key={"user_id": user_id},
                update_expr="SET last_login = :t",
                expr_values={":t": datetime.now(timezone.utc).isoformat()}
            )
        except Exception as e:
            logger.warning(f"Failed to update last_login: {e}")

    def get_all_users(self) -> dict:
        result = self.db.scan_items(limit=500)
        items  = result["items"]
        for u in items:
            u.pop("hashed_password", None)
        items = sorted(items, key=lambda x: x.get("created_at",""), reverse=True)
        return {"total": len(items), "items": items}

    def get_user_by_username(self, username: str) -> Optional[dict]:
        try:
            result = self.db.scan_items(
                filter_expression=Attr("username").eq(username),
                limit=10
            )
            items = result.get("items", [])
            return items[0] if items else None
        except Exception as e:
            logger.error(f"get_user_by_username failed: {e}")
            return None

    def get_user(self, user_id: str) -> Optional[dict]:
        user = self.db.get_item({"user_id": user_id})
        if user:
            user.pop("hashed_password", None)
        return user

    def create_user(self, data: dict) -> dict:
        existing = self.get_user_by_username(data["username"])
        if existing:
            raise ValueError(f"Username '{data['username']}' already exists")
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        now     = datetime.now(timezone.utc).isoformat()
        item = {
            "user_id":               user_id,
            "username":              data["username"],
            "full_name":             data["full_name"],
            "email":                 data["email"],
            "department":            data.get("department", ""),
            "designation":           data.get("designation", ""),
            "phone":                 data.get("phone", ""),
            "role":                  data.get("role", "viewer"),
            "status":                "ACTIVE",
            "mfa_enabled":           data.get("mfa_enabled", False),
            "failed_logins":         0,
            "force_password_change": data.get("force_password_change", False),
            "hashed_password":       pwd_context.hash(data["password"]),
            "created_at":            now,
            "updated_at":            now,
            "last_login":            None,
        }
        self.db.put_item(item)
        logger.info(f"User created: {user_id} ({data['username']})")
        result = {k: v for k, v in item.items() if k != "hashed_password"}
        return result

    def update_user(self, user_id: str, data: dict) -> bool:
        now    = datetime.now(timezone.utc).isoformat()
        fields = ["full_name","email","department","designation","phone","role","status","mfa_enabled"]
        sets   = ["updated_at = :u"]
        vals   = {":u": now}
        for f in fields:
            if f in data and data[f] is not None:
                sets.append(f"{f} = :{f}")
                vals[f":{f}"] = data[f]
        return self.db.update_item(
            key={"user_id": user_id},
            update_expr=f"SET {', '.join(sets)}",
            expr_values=vals
        )

    def delete_user(self, user_id: str) -> bool:
        return self.db.delete_item({"user_id": user_id})

    def disable_user(self, user_id: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"user_id": user_id},
            update_expr="SET #st = :s, updated_at = :u",
            expr_values={":s": "DISABLED", ":u": now},
            expr_names={"#st": "status"}
        )

    def enable_user(self, user_id: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"user_id": user_id},
            update_expr="SET #st = :s, failed_logins = :z, updated_at = :u",
            expr_values={":s": "ACTIVE", ":z": 0, ":u": now},
            expr_names={"#st": "status"}
        )

    def reset_password(self, user_id: str, new_password: str, force_change: bool = True) -> bool:
        now    = datetime.now(timezone.utc).isoformat()
        hashed = pwd_context.hash(new_password)
        return self.db.update_item(
            key={"user_id": user_id},
            update_expr="SET hashed_password = :p, force_password_change = :f, updated_at = :u, failed_logins = :z",
            expr_values={":p": hashed, ":f": force_change, ":u": now, ":z": 0}
        )

    def generate_temp_password(self, user_id: str) -> str:
        chars   = string.ascii_letters + string.digits + "!@#$%"
        temp_pw = ''.join(secrets.choice(chars) for _ in range(12))
        self.reset_password(user_id, temp_pw, force_change=True)
        return temp_pw

    def update_status(self, user_id: str, status: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return self.db.update_item(
            key={"user_id": user_id},
            update_expr="SET #st = :s, updated_at = :u",
            expr_values={":s": status, ":u": now},
            expr_names={"#st": "status"}
        )