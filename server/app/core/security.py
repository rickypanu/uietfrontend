"""JWT helpers and FastAPI dependencies for the three roles: student, teacher, admin."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core import config

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(subject: str, role: str, expires_minutes: Optional[int] = None) -> str:
    if expires_minutes is None:
        expires_minutes = (
            config.ADMIN_TOKEN_EXPIRE_MINUTES if role == "admin" else config.USER_TOKEN_EXPIRE_MINUTES
        )
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)


def token_payload(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not payload.get("sub") or not payload.get("role"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


def _require_role(role: str, payload: dict) -> str:
    if payload.get("role") != role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{role.capitalize()} access required")
    return str(payload["sub"])


def current_student(payload: dict = Depends(token_payload)) -> str:
    """Roll number of the logged-in student."""
    return _require_role("student", payload)


def current_teacher(payload: dict = Depends(token_payload)) -> str:
    """Employee id of the logged-in teacher."""
    return _require_role("teacher", payload)


def current_admin(payload: dict = Depends(token_payload)) -> str:
    """Admin id of the logged-in admin."""
    return _require_role("admin", payload)


def own_student(roll_no: str, me: str = Depends(current_student)) -> str:
    """For routes with a ``{roll_no}`` path parameter: only the owner may access them."""
    if roll_no.strip().upper() != me.upper():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own data")
    return me


def own_teacher(employee_id: str, me: str = Depends(current_teacher)) -> str:
    """For routes with an ``{employee_id}`` path parameter: only the owner may access them."""
    if employee_id.strip().upper() != me.upper():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own data")
    return me
