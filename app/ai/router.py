from __future__ import annotations

import enum
import logging

from .providers.base import AIProvider, ProviderType
from .providers.claude import ClaudeProvider
from .providers.gemini import GeminiProvider

logger = logging.getLogger(__name__)


class TaskType(str, enum.Enum):
    GENERATE = "generate"
    EVALUATE = "evaluate"
    COACH = "coach"
    PROCESS_VIEW = "process_view"


class AIRouter:
    """Routes AI requests to the appropriate provider based on task type and difficulty."""

    def __init__(self) -> None:
        self._gemini = GeminiProvider()
        self._claude = ClaudeProvider()

    def select_provider(
        self,
        *,
        quest_id: int = 1,
        difficulty: str = "intermediate",
        task_type: TaskType = TaskType.GENERATE,
    ) -> AIProvider:
        if task_type == TaskType.EVALUATE:
            return self._claude

        if task_type == TaskType.PROCESS_VIEW:
            return self._claude

        if difficulty == "advanced":
            return self._claude

        return self._gemini

    def get_provider(self, provider_type: ProviderType) -> AIProvider:
        if provider_type == ProviderType.CLAUDE:
            return self._claude
        return self._gemini

    @property
    def gemini(self) -> GeminiProvider:
        return self._gemini

    @property
    def claude(self) -> ClaudeProvider:
        return self._claude


_router: AIRouter | None = None


def get_ai_router() -> AIRouter:
    global _router
    if _router is None:
        _router = AIRouter()
    return _router
