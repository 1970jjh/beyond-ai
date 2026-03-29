import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BattleStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    SCORING = "scoring"
    COMPLETED = "completed"


class BattleResult(str, enum.Enum):
    HUMAN_WIN = "human_win"
    AI_WIN = "ai_win"
    DRAW = "draw"
    IN_PROGRESS = "in_progress"


class BattleMode(str, enum.Enum):
    COMPETITION = "competition"
    COACH = "coach"
    PARTNER = "partner"
    REVIEWER = "reviewer"


class QuestType(str, enum.Enum):
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    COMMUNICATION = "communication"
    EXECUTION = "execution"


class Battle(Base):
    __tablename__ = "battles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    quest_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    team_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("teams.id"), nullable=True)

    status: Mapped[BattleStatus] = mapped_column(
        Enum(BattleStatus), default=BattleStatus.PENDING
    )
    result: Mapped[BattleResult] = mapped_column(
        Enum(BattleResult), default=BattleResult.IN_PROGRESS
    )
    mode: Mapped[BattleMode] = mapped_column(
        Enum(BattleMode), default=BattleMode.COMPETITION
    )
    difficulty: Mapped[str] = mapped_column(String(20), default="intermediate")

    task_description: Mapped[str] = mapped_column(Text, nullable=False)
    human_submission: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_submission: Mapped[str | None] = mapped_column(Text, nullable=True)

    human_score_quality: Mapped[float | None] = mapped_column(Float, nullable=True)
    human_score_creativity: Mapped[float | None] = mapped_column(Float, nullable=True)
    human_score_execution: Mapped[float | None] = mapped_column(Float, nullable=True)
    human_score_efficiency: Mapped[float | None] = mapped_column(Float, nullable=True)
    human_score_total: Mapped[float | None] = mapped_column(Float, nullable=True)

    ai_score_quality: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_score_creativity: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_score_execution: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_score_efficiency: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_score_total: Mapped[float | None] = mapped_column(Float, nullable=True)

    human_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    comparison: Mapped[str | None] = mapped_column(Text, nullable=True)

    time_limit_sec: Mapped[int] = mapped_column(Integer, default=3600)
    hint_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_provider: Mapped[str | None] = mapped_column(String(20), nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    user: Mapped["User"] = relationship(back_populates="battles")  # noqa: F821


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(30), default="member")
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    team: Mapped["Team"] = relationship(back_populates="members")
