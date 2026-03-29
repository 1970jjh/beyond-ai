from __future__ import annotations

from typing import Any

from app.repositories.base import SheetsRepository


class QuestResultRepository(SheetsRepository):
    """Repository for quest_results worksheet - mission performance records."""

    HEADERS = [
        "id", "room_id", "user_id", "quest_id",
        "submission_text", "ai_submission_text",
        "human_score", "ai_score",
        "quality_score", "creativity_score", "executability_score", "time_score",
        "peer_score", "final_score", "result", "mode_used",
        "duration_sec", "feedback_json", "submitted_at", "_version",
    ]

    def __init__(self) -> None:
        super().__init__(worksheet_name="quest_results", id_field="id")

    async def submit_result(
        self,
        room_id: str,
        user_id: str,
        quest_id: int,
        submission_text: str,
        mode_used: str = "competition",
        duration_sec: int = 0,
    ) -> dict[str, Any]:
        return await self.create({
            "id": self.new_id(),
            "room_id": room_id,
            "user_id": user_id,
            "quest_id": quest_id,
            "submission_text": submission_text,
            "ai_submission_text": "",
            "human_score": 0,
            "ai_score": 0,
            "quality_score": 0,
            "creativity_score": 0,
            "executability_score": 0,
            "time_score": 0,
            "peer_score": 0,
            "final_score": 0,
            "result": "",
            "mode_used": mode_used,
            "duration_sec": duration_sec,
            "feedback_json": "{}",
            "submitted_at": self.now_iso(),
        })

    async def update_scores(
        self,
        result_id: str,
        scores: dict[str, Any],
        version: int | None = None,
    ) -> dict[str, Any]:
        return await self.update(result_id, scores, expected_version=version)

    async def get_room_results(self, room_id: str) -> list[dict[str, Any]]:
        return await self.find_by_field("room_id", room_id)

    async def get_user_results(self, user_id: str) -> list[dict[str, Any]]:
        return await self.find_by_field("user_id", user_id)

    async def get_quest_results(
        self, room_id: str, quest_id: int
    ) -> list[dict[str, Any]]:
        room_results = await self.get_room_results(room_id)
        return [r for r in room_results if str(r.get("quest_id")) == str(quest_id)]


quest_result_repo = QuestResultRepository()
