import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.gamification import (
    LeaderboardEntryResponse,
    PointAwardRequest,
    PointsSummary,
    PointTransactionResponse,
    UserBadgeResponse,
)
from app.services.gamification_service import (
    award_points,
    get_leaderboard,
    get_user_badges,
    get_user_points,
)

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/leaderboard", response_model=list[LeaderboardEntryResponse])
async def leaderboard(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    entries = await get_leaderboard(db, limit=limit)
    return entries


@router.get("/points/me", response_model=PointsSummary)
async def my_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_points(db, current_user.id)


@router.get("/badges/me", response_model=list[UserBadgeResponse])
async def my_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_badges(db, current_user.id)


@router.post("/points/{user_id}", response_model=PointTransactionResponse, status_code=201)
async def award_user_points(
    user_id: str,
    body: PointAwardRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
):
    txn = await award_points(db, uuid.UUID(user_id), body.amount, body.reason)
    await db.flush()
    await db.refresh(txn)
    return txn
