from __future__ import annotations

from typing import Any

from app.repositories.base import SheetsRepository


class AuthRepository(SheetsRepository):
    """Repository for auth_admins worksheet - manages admin user list."""

    HEADERS = ["email", "role", "name", "added_at", "added_by", "is_active"]

    def __init__(self) -> None:
        super().__init__(worksheet_name="auth_admins", id_field="email")

    async def find_admin_by_email(self, email: str) -> dict[str, Any] | None:
        admins = await self.find_by_field("email", email)
        active = [a for a in admins if str(a.get("is_active", "")).upper() == "TRUE"]
        return active[0] if active else None

    async def is_admin(self, email: str) -> bool:
        admin = await self.find_admin_by_email(email)
        return admin is not None

    async def get_role(self, email: str) -> str | None:
        admin = await self.find_admin_by_email(email)
        return admin.get("role") if admin else None

    async def add_admin(
        self, email: str, role: str, name: str, added_by: str
    ) -> dict[str, Any]:
        return await self.create({
            "email": email,
            "role": role,
            "name": name,
            "added_at": self.now_iso(),
            "added_by": added_by,
            "is_active": "TRUE",
        })

    async def remove_admin(self, email: str) -> dict[str, Any]:
        return await self.update(email, {"is_active": "FALSE"})

    async def list_active_admins(self) -> list[dict[str, Any]]:
        all_admins = await self.find_all()
        return [a for a in all_admins if str(a.get("is_active", "")).upper() == "TRUE"]


auth_repo = AuthRepository()
