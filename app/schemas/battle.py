from __future__ import annotations

from pydantic import BaseModel, Field


class BattleStartRequest(BaseModel):
    quest_id: int = Field(ge=1, le=12)
    task_description: str = Field(min_length=10)
    difficulty: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")
    time_limit_sec: int = Field(default=3600, ge=300, le=7200)
    constraints: list[str] = Field(default_factory=list)


class BattleSubmitRequest(BaseModel):
    submission: str = Field(min_length=1)


class BattleModeSwitch(BaseModel):
    mode: str = Field(pattern="^(competition|coach|partner|reviewer)$")
    ai_role: str | None = None


class CoachRequest(BaseModel):
    question: str = Field(min_length=1)
    current_progress: str = Field(default="")


class ReviewRequest(BaseModel):
    submission: str = Field(min_length=1)


class BattleScoresResponse(BaseModel):
    quality: float
    creativity: float
    execution: float
    efficiency: float
    total: float
    feedback: str


class BattleResponse(BaseModel):
    id: str
    quest_id: int
    status: str
    result: str
    mode: str
    difficulty: str
    task_description: str
    human_submission: str | None = None
    ai_submission: str | None = None
    human_scores: BattleScoresResponse | None = None
    ai_scores: BattleScoresResponse | None = None
    comparison: str | None = None
    time_limit_sec: int
    hint_count: int
    ai_provider: str | None = None


class BattleListResponse(BaseModel):
    battles: list[BattleResponse]
    total: int


class AIGenerateResponse(BaseModel):
    content: str
    provider: str
    model: str
    thinking_steps: list[ThinkingStepResponse] = Field(default_factory=list)


class ThinkingStepResponse(BaseModel):
    phase: str
    title: str
    description: str
    thinking: str
    progress: int


class PersonaResponse(BaseModel):
    id: str
    name: str
    title: str
    personality: str
    expertise: list[str]
    communication_style: str
    catchphrase: str
    strengths: list[str]
    weaknesses: list[str]


class DifficultyResponse(BaseModel):
    level: str
    recommended_level: str | None = None
    params: DifficultyParamsResponse


class DifficultyParamsResponse(BaseModel):
    temperature: float
    max_tokens: int
    thinking_depth: int
    framework_usage: float
    human_likeness: float
