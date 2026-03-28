import uuid
from datetime import datetime

from pydantic import BaseModel


class PointAwardRequest(BaseModel):
    amount: int
    reason: str


class PointTransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PointsSummary(BaseModel):
    total_points: int
    transaction_count: int


class BadgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    icon_url: str | None
    condition_type: str
    condition_value: int

    model_config = {"from_attributes": True}


class UserBadgeResponse(BaseModel):
    badge: BadgeResponse
    earned_at: datetime


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: uuid.UUID
    display_name: str
    total_points: int
    courses_completed: int
    lessons_completed: int
