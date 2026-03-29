from __future__ import annotations

import random
import string
from typing import Any

from app.repositories.base import SheetsRepository


def generate_invite_code(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


class RoomRepository(SheetsRepository):
    """Repository for rooms worksheet - quest room management."""

    HEADERS = [
        "id", "name", "quest_id", "status", "difficulty",
        "created_by", "invite_code", "max_participants", "current_count",
        "start_time", "end_time", "created_at", "settings_json", "_version",
    ]

    def __init__(self) -> None:
        super().__init__(worksheet_name="rooms", id_field="id")

    async def create_room(
        self,
        name: str,
        quest_id: int,
        created_by: str,
        difficulty: str = "intermediate",
        max_participants: int = 30,
        start_time: str = "",
        end_time: str = "",
        settings_json: str = "{}",
    ) -> dict[str, Any]:
        invite_code = await self._generate_unique_code()
        return await self.create({
            "id": self.new_id(),
            "name": name,
            "quest_id": quest_id,
            "status": "waiting",
            "difficulty": difficulty,
            "created_by": created_by,
            "invite_code": invite_code,
            "max_participants": max_participants,
            "current_count": 0,
            "start_time": start_time,
            "end_time": end_time,
            "created_at": self.now_iso(),
            "settings_json": settings_json,
        })

    async def find_by_invite_code(self, code: str) -> dict[str, Any] | None:
        return await self.find_one_by_field("invite_code", code)

    async def find_active_rooms(self) -> list[dict[str, Any]]:
        all_rooms = await self.find_all()
        return [r for r in all_rooms if r.get("status") in ("waiting", "active")]

    async def update_status(
        self, room_id: str, status: str, version: int | None = None
    ) -> dict[str, Any]:
        return await self.update(room_id, {"status": status}, expected_version=version)

    async def increment_count(self, room_id: str) -> dict[str, Any]:
        room = await self.find_by_id(room_id)
        if not room:
            raise ValueError(f"Room {room_id} not found")
        new_count = int(room.get("current_count", 0)) + 1
        return await self.update(room_id, {"current_count": new_count})

    async def decrement_count(self, room_id: str) -> dict[str, Any]:
        room = await self.find_by_id(room_id)
        if not room:
            raise ValueError(f"Room {room_id} not found")
        current = int(room.get("current_count", 0))
        new_count = max(0, current - 1)
        return await self.update(room_id, {"current_count": new_count})

    async def _generate_unique_code(self) -> str:
        for _ in range(10):
            code = generate_invite_code()
            existing = await self.find_by_invite_code(code)
            if not existing:
                return code
        raise RuntimeError("Failed to generate unique invite code after 10 attempts")


class RoomParticipantRepository(SheetsRepository):
    """Repository for room_participants worksheet."""

    HEADERS = [
        "room_id", "user_id", "user_email", "team_name",
        "joined_at", "status", "_version",
    ]

    def __init__(self) -> None:
        super().__init__(worksheet_name="room_participants", id_field="user_id")

    async def join_room(
        self, room_id: str, user_id: str, user_email: str, team_name: str = ""
    ) -> dict[str, Any]:
        return await self.create({
            "room_id": room_id,
            "user_id": user_id,
            "user_email": user_email,
            "team_name": team_name,
            "joined_at": self.now_iso(),
            "status": "active",
        })

    async def leave_room(self, room_id: str, user_id: str) -> dict[str, Any]:
        participants = await self.find_by_field("room_id", room_id)
        target = next(
            (p for p in participants if p.get("user_id") == user_id), None
        )
        if not target:
            raise ValueError(f"User {user_id} not in room {room_id}")
        return await self.update(target.get("user_id", ""), {"status": "left"})

    async def get_room_participants(self, room_id: str) -> list[dict[str, Any]]:
        participants = await self.find_by_field("room_id", room_id)
        return [p for p in participants if p.get("status") == "active"]

    async def is_in_room(self, room_id: str, user_id: str) -> bool:
        participants = await self.get_room_participants(room_id)
        return any(p.get("user_id") == user_id for p in participants)


room_repo = RoomRepository()
room_participant_repo = RoomParticipantRepository()
