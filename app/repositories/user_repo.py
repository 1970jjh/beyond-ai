from __future__ import annotations

from typing import Any

from app.repositories.base import SheetsRepository


class UserRepository(SheetsRepository):
    """Repository for users worksheet - all participants (learners + admins)."""

    HEADERS = [
        "id", "email", "display_name", "team", "role",
        "avatar_url", "total_points", "current_streak",
        "joined_at", "last_active_at", "is_active", "_version",
    ]

    def __init__(self) -> None:
        super().__init__(worksheet_name="users", id_field="id")

    async def find_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.find_one_by_field("email", email)

    async def create_user(
        self,
        email: str,
        display_name: str,
        role: str = "learner",
        avatar_url: str = "",
        team: str = "",
    ) -> dict[str, Any]:
        now = self.now_iso()
        return await self.create({
            "id": self.new_id(),
            "email": email,
            "display_name": display_name,
            "team": team,
            "role": role,
            "avatar_url": avatar_url,
            "total_points": 0,
            "current_streak": 0,
            "joined_at": now,
            "last_active_at": now,
            "is_active": "TRUE",
        })

    async def get_or_create(
        self, email: str, display_name: str, avatar_url: str = "", role: str = "learner"
    ) -> dict[str, Any]:
        existing = await self.find_by_email(email)
        if existing:
            return existing
        return await self.create_user(
            email=email,
            display_name=display_name,
            role=role,
            avatar_url=avatar_url,
        )

    async def update_last_active(self, user_id: str) -> dict[str, Any]:
        return await self.update(user_id, {"last_active_at": self.now_iso()})

    async def add_points(
        self, user_id: str, points: int, current_version: int | None = None
    ) -> dict[str, Any]:
        user = await self.find_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        new_total = int(user.get("total_points", 0)) + points
        return await self.update(
            user_id,
            {"total_points": new_total, "last_active_at": self.now_iso()},
            expected_version=current_version,
        )

    async def list_active_users(self) -> list[dict[str, Any]]:
        return await self.find_all({"is_active": "TRUE"})

    async def get_leaderboard(self, limit: int = 10) -> list[dict[str, Any]]:
        users = await self.list_active_users()
        sorted_users = sorted(
            users, key=lambda u: int(u.get("total_points", 0)), reverse=True
        )
        return sorted_users[:limit]


user_repo = UserRepository()
