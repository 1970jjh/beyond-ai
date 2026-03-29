"""Dependency injection for GWS-based auth (Google Sheets backend).

Replaces deps.py's SQLAlchemy-based auth with Sheets-based user lookup.
Use these dependencies in GWS-mode API routes.
"""

from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token, has_permission
from app.repositories.auth_repo import auth_repo
from app.repositories.user_repo import user_repo

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    """Extract and validate user from JWT, lookup in Sheets."""
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = await user_repo.find_by_id(user_id)
    if not user or str(user.get("is_active", "")).upper() != "TRUE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Enrich with admin role from auth_admins sheet
    admin_role = await auth_repo.get_role(user.get("email", ""))
    if admin_role:
        user = {**user, "role": admin_role}

    return user


def require_role(min_role: str):
    """Decorator-style dependency: require minimum role level."""

    async def dependency(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "learner")
        if not has_permission(user_role, min_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {min_role} or higher",
            )
        return current_user

    return dependency
