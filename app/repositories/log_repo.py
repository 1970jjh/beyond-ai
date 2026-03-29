from __future__ import annotations

from typing import Any

from app.repositories.base import SheetsRepository


class ActivityLogRepository(SheetsRepository):
    """Repository for activity_logs worksheet - audit trail."""

    HEADERS = [
        "id", "user_id", "action", "target_type", "target_id",
        "detail_json", "ip_address", "created_at", "_version",
    ]

    # Valid action types
    ACTIONS = {
        "login", "logout", "room_create", "room_join", "room_leave",
        "quest_start", "quest_submit", "score_update", "admin_action",
    }

    def __init__(self) -> None:
        super().__init__(worksheet_name="activity_logs", id_field="id")

    async def log_activity(
        self,
        user_id: str,
        action: str,
        target_type: str = "",
        target_id: str = "",
        detail_json: str = "{}",
        ip_address: str = "",
    ) -> dict[str, Any]:
        return await self.create({
            "id": self.new_id(),
            "user_id": user_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "detail_json": detail_json,
            "ip_address": ip_address,
            "created_at": self.now_iso(),
        })

    async def get_user_logs(self, user_id: str) -> list[dict[str, Any]]:
        return await self.find_by_field("user_id", user_id)

    async def get_recent_logs(self, limit: int = 100) -> list[dict[str, Any]]:
        all_logs = await self.find_all()
        sorted_logs = sorted(
            all_logs, key=lambda x: x.get("created_at", ""), reverse=True
        )
        return sorted_logs[:limit]


activity_log_repo = ActivityLogRepository()
