import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import (
    Badge,
    LeaderboardEntry,
    PointTransaction,
    UserBadge,
)
from app.models.user import User


async def award_points(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: int,
    reason: str,
) -> PointTransaction:
    txn = PointTransaction(user_id=user_id, amount=amount, reason=reason)
    db.add(txn)

    result = await db.execute(
        select(LeaderboardEntry).where(LeaderboardEntry.user_id == user_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        entry = LeaderboardEntry(user_id=user_id, total_points=amount)
        db.add(entry)
    else:
        entry.total_points = entry.total_points + amount

    await db.flush()
    await _check_badge_eligibility(db, user_id, entry)
    return txn


async def get_user_points(db: AsyncSession, user_id: uuid.UUID) -> dict:
    total = await db.execute(
        select(func.coalesce(func.sum(PointTransaction.amount), 0)).where(
            PointTransaction.user_id == user_id
        )
    )
    count = await db.execute(
        select(func.count()).where(PointTransaction.user_id == user_id)
    )
    return {
        "total_points": total.scalar_one(),
        "transaction_count": count.scalar_one(),
    }


async def get_user_badges(db: AsyncSession, user_id: uuid.UUID) -> list:
    result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.earned_at.desc())
    )
    return [
        {"badge": badge, "earned_at": ub.earned_at}
        for ub, badge in result.all()
    ]


async def get_leaderboard(db: AsyncSession, limit: int = 20) -> list[dict]:
    result = await db.execute(
        select(LeaderboardEntry, User.display_name)
        .join(User, LeaderboardEntry.user_id == User.id)
        .order_by(LeaderboardEntry.total_points.desc())
        .limit(limit)
    )
    return [
        {
            "rank": idx + 1,
            "user_id": entry.user_id,
            "display_name": name,
            "total_points": entry.total_points,
            "courses_completed": entry.courses_completed,
            "lessons_completed": entry.lessons_completed,
        }
        for idx, (entry, name) in enumerate(result.all())
    ]


async def _check_badge_eligibility(
    db: AsyncSession,
    user_id: uuid.UUID,
    leaderboard: LeaderboardEntry,
) -> None:
    badges_result = await db.execute(select(Badge))
    all_badges = badges_result.scalars().all()

    earned_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
    )
    earned_ids = {row for row in earned_result.scalars().all()}

    for badge in all_badges:
        if badge.id in earned_ids:
            continue

        earned = False
        if badge.condition_type.value == "total_points":
            earned = leaderboard.total_points >= badge.condition_value
        elif badge.condition_type.value == "courses_completed":
            earned = leaderboard.courses_completed >= badge.condition_value
        elif badge.condition_type.value == "lessons_completed":
            earned = leaderboard.lessons_completed >= badge.condition_value

        if earned:
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))
