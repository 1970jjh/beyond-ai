from __future__ import annotations

import enum
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator


class ProviderType(str, enum.Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"


@dataclass(frozen=True)
class AIRequest:
    system_prompt: str
    user_prompt: str
    temperature: float = 0.5
    max_tokens: int = 4096
    quest_id: int = 1
    stream_thinking: bool = False


@dataclass(frozen=True)
class AIResponse:
    content: str
    provider: ProviderType
    model: str
    usage_tokens: int = 0
    thinking_steps: tuple[ThinkingStep, ...] = ()


@dataclass(frozen=True)
class ThinkingStep:
    phase: str
    title: str
    description: str
    thinking: str
    progress: int
    duration_ms: int = 0
    insights: tuple[str, ...] = ()


@dataclass(frozen=True)
class StreamChunk:
    chunk_type: str  # "thinking" | "content" | "done"
    content: str = ""
    thinking_step: ThinkingStep | None = None
    progress: int = 0


@dataclass(frozen=True)
class EvalRequest:
    quest_description: str
    evaluation_criteria: tuple[EvalCriterion, ...]
    submission_a: str
    submission_b: str


@dataclass(frozen=True)
class EvalCriterion:
    name: str
    weight: float
    description: str
    rubric: tuple[RubricLevel, ...] = ()


@dataclass(frozen=True)
class RubricLevel:
    score: int
    description: str


@dataclass(frozen=True)
class EvalResult:
    scores_a: dict[str, float] = field(default_factory=dict)
    scores_b: dict[str, float] = field(default_factory=dict)
    total_a: float = 0.0
    total_b: float = 0.0
    feedback_a: str = ""
    feedback_b: str = ""
    comparison: str = ""


class AIProvider(ABC):
    provider_type: ProviderType

    @abstractmethod
    async def generate(self, request: AIRequest) -> AIResponse:
        ...

    @abstractmethod
    async def stream(self, request: AIRequest) -> AsyncIterator[StreamChunk]:
        ...

    @abstractmethod
    async def evaluate(self, request: EvalRequest) -> EvalResult:
        ...
